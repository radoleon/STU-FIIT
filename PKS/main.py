import socket, struct, threading, time, os, sys, ipaddress
from enum import Enum
from binascii import crc_hqx

NO_ACTION = 0

class HANDSHAKE(Enum):
    NOT_INITIATED = 0
    PENDING = 1
    ESTABLISHED = 2

class CLOSE(Enum):
    NOT_INITIATED = 0
    PENDING = 1
    CLOSED = 2

class TYPE(Enum):
    TEXT = 1
    FILE = 2
    TEXT_F = 3
    FILE_F = 4
    HANDSHAKE = 5
    KEEPALIVE = 6
    CLOSE = 7

class ACTION(Enum):
    ACK = 1
    NACK = 2
    SYN = 3
    FIN = 4

class Peer:

    def __init__(self, host, port, ongoing_host, ongoing_port, fragment_size, filepath):
        self.host = host
        self.port = port
        self.ongoing_host = ongoing_host
        self.ongoing_port = ongoing_port

        self.ongoing_address = (self.ongoing_host, self.ongoing_port)

        self.fragment_size = fragment_size
        self.filepath = filepath

        self.connection_established = HANDSHAKE.NOT_INITIATED.value
        self.connection_terminated = CLOSE.NOT_INITIATED.value

        self.initiated_close = False
        
        self.is_inactive = False
        self.is_pending = False
        self.is_connected = False

        self.last_action_ts = time.time()

        self.sending_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self.listening_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)  
        
        self.listening_socket.bind((self.host, self.port))

    def start_listening(self):            
        self.print_on_thread(f'\n[START] Listening on port {self.port} ...\n')

        while True:
            try:
                message, addr = self.listening_socket.recvfrom(1472)
                self.last_action_ts = time.time()
            except socket.error:
                self.print_on_thread(f'\n[ERROR] Socket error while listening.\n>> ')
                continue
            
            message = unpack_packet(message)
            
            if message['type'] == TYPE.HANDSHAKE.value and not self.is_connected:
                self.establish_connection(message)
                self.print_on_thread(f'\n[CONNECTING...] Received: {ACTION(message["action"]).name} from ({addr[0]}:{addr[1]})')

                if self.connection_established == HANDSHAKE.ESTABLISHED.value:
                    self.print_on_thread('\n[CONNECTED] Connection Established.\n>> ')
                    
                    self.connection_established = HANDSHAKE.NOT_INITIATED.value
                    self.is_connected = True

            elif message['type'] == TYPE.CLOSE.value and self.is_connected:
                self.close_connection(message)

                if not self.initiated_close:
                    self.print_on_thread('\n')
                
                self.print_on_thread(f'[CLOSING...] Received: {ACTION(message["action"]).name} from ({addr[0]}:{addr[1]})')

                if self.connection_terminated == CLOSE.CLOSED.value:
                    self.print_on_thread('\n[CLOSED] Connection Terminated.')

                    self.print_on_thread('\n>> ') if not self.initiated_close else self.print_on_thread('\n')
                    self.initiated_close = False

                    self.connection_terminated = CLOSE.NOT_INITIATED.value
                    self.is_connected = False

            elif message['type'] == TYPE.KEEPALIVE.value:                
                if not self.is_inactive:
                    header = construct_header(type=TYPE.KEEPALIVE.value, action=ACTION.ACK.value)
                    self.sending_socket.sendto(header, self.ongoing_address)

                self.is_inactive = False
            
            else:
                if message['action'] != NO_ACTION:

                    if message['action'] == ACTION.ACK.value:
                        self.is_pending = False
                    
                    elif message['action'] == ACTION.NACK.value:
                        self.sending_socket.sendto(self.last_sent_packet, (self.ongoing_address))
                        self.packet_sent_ts = time.time()

                else:
                    if message['type'] == TYPE.TEXT.value:
                        self.handle_text(message, addr)
                    elif message['type'] == TYPE.TEXT_F.value:
                        self.handle_text_fragmented(message, addr)
                    elif message['type'] == TYPE.FILE.value:
                        self.handle_file(message)
                    elif message['type'] == TYPE.FILE_F.value:
                        self.handle_file_fragmented(message)
          
    def handle_text(self, message, addr):
        is_correct = check_integrity(message['checksum'], message['data'])

        if is_correct:
            self.print_on_thread(f'\n[MESSAGE] Received message from ({addr[0]}:{addr[1]}):\n{message["data"].decode()}\n>> ')
            header = construct_header(type=TYPE.TEXT.value, action=ACTION.ACK.value)
        else:
            header = construct_header(type=TYPE.TEXT.value, action=ACTION.NACK.value)
                    
        self.sending_socket.sendto(header, self.ongoing_address)

    def handle_text_fragmented(self, message, addr):
        fragment_number = message['fragment_number']
        data = message['data']

        if fragment_number == 1:
                    
            self.text_buffer = { }
            self.fragmentation_start = time.time()
            self.fragments_expected = message['total_fragments']
            
            self.print_on_thread(f'\n[RECEIVING] Start receiving a text of {self.fragments_expected} fragments.')

        is_correct = check_integrity(message['checksum'], data)

        if is_correct:
            if fragment_number not in self.text_buffer:
                self.text_buffer[fragment_number] = data 
                self.print_on_thread(f'\n[RECEIVING] Succesfuly received fragment: {fragment_number}/{self.fragments_expected}')
                        
            header = construct_header(type=TYPE.TEXT_F.value, action=ACTION.ACK.value, fragment_number=fragment_number)
        else:
            self.print_on_thread(f'\n[ERROR] Received corrupted fragment {fragment_number}')
            header = construct_header(type=TYPE.TEXT_F.value, action=ACTION.NACK.value, fragment_number=fragment_number)

        self.sending_socket.sendto(header, self.ongoing_address)

        if len(self.text_buffer) == self.fragments_expected:
            self.fragmentation_end = time.time()
            text_data = b''.join(self.text_buffer[i] for i in range(1, len(self.text_buffer) + 1))
            text = text_data.decode()

            self.print_on_thread(f'\n[TIME] {self.fragmentation_end - self.fragmentation_start:.2f}s\n')
            self.print_on_thread(f'[MESSAGE] Received message from ({addr[0]}:{addr[1]}) of {len(text_data)}B:\n{text}\n>> ')

    def handle_file(self, message):
        data = message['data']
        
        length_of_filename = int(data[0])
        filename = data[1: 1 + length_of_filename].decode()
        
        filepath_current = os.path.join(self.filepath, filename)
        file_buffer = { 1: data[1 + length_of_filename:] }

        is_correct = check_integrity(message['checksum'], data)

        if is_correct:
            header = construct_header(type=TYPE.FILE.value, action=ACTION.ACK.value)
        else:
            header = construct_header(type=TYPE.FILE.value, action=ACTION.NACK.value)

        self.sending_socket.sendto(header, self.ongoing_address)

        if is_correct:
            save_file(filepath_current, file_buffer)

    def handle_file_fragmented(self, message):
        fragment_number = message['fragment_number']
        data = message['data']
                
        if fragment_number == 1:
                    
            self.file_buffer = { }
            self.fragmentation_start = time.time()
            self.fragments_expected = message['total_fragments']
                        
            self.print_on_thread(f'\n[RECEIVING] Start receiving a file of {self.fragments_expected} fragments.')

        is_correct = check_integrity(message['checksum'], data)
                    
        if is_correct:
            if fragment_number not in self.file_buffer:
                self.file_buffer[fragment_number] = data 
                
            self.print_on_thread(f'\n[RECEIVING] Received fragment {fragment_number}/{self.fragments_expected}')                
            header = construct_header(type=TYPE.FILE_F.value, action=ACTION.ACK.value, fragment_number=fragment_number)
        else:
            self.print_on_thread(f'\n[ERROR] Received corrupted fragment {fragment_number}')
            header = construct_header(type=TYPE.FILE_F.value, action=ACTION.NACK.value, fragment_number=fragment_number)
                    
        self.sending_socket.sendto(header, self.ongoing_address)

        if len(self.file_buffer) == self.fragments_expected:
            self.fragmentation_end = time.time()
            self.print_on_thread(f'\n[TIME] {self.fragmentation_end - self.fragmentation_start:.2f}s')
            
            save_file(None, self.file_buffer)

    def send_message(self, message=False, is_file=False):
        if message:
            if is_file:
                try:
                    filepath = str(message)
                    filename = os.path.basename(filepath)
                    
                    with open(filepath, 'rb') as file:
                        data = file.read()

                    encoded_filename = struct.pack('!B', len(filename.encode())) + filename.encode()
                    data = encoded_filename + data
                
                except (OSError, FileNotFoundError, PermissionError):
                    self.print_on_thread('The provided file was not found.\n')
                    return
            else:
                data = str(message)
                new_str = str()

                for char in data:
                    if char in ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']:
                        if char == '9':
                            new_str += '0'
                        else:
                           new_str += str(int(char) + 1) 
                    elif char.isupper():
                        new_str += char.lower()
                    elif char.islower():
                        new_str += char.upper()
                    else:
                        new_str += char
                
                data = new_str.encode()

            if len(data) > self.fragment_size:
                
                total_fragments = (len(data) // self.fragment_size) + (1 if len(data) % self.fragment_size != 0 else 0)
                last_fragment = (len(data) % self.fragment_size)
                fragment_number = 1

                output = ''
                
                if is_file:
                    output += f'\n\t[SENDING]\n\tFile: {filename}\n\tSize: {len(data) - len(encoded_filename)}B\n\tTotal Fragments: {total_fragments}\n\tFragment Size: {self.fragment_size + 13}B\n'
                else:
                    output += f'\n\t[SENDING]\n\tText Message\n\tSize: {len(data)}B\n\tTotal Fragments: {total_fragments}\n\tFragment Size: {self.fragment_size + 13}B\n'
                
                output += f'\tLast Fragment: {last_fragment + 13}B\n\n' if last_fragment != 0 else '\n'

                self.print_on_thread(output)

                for i in range(0, len(data), self.fragment_size):
                    fragment = data[i: i + self.fragment_size]    
                    
                    type = TYPE.FILE_F.value if is_file else TYPE.TEXT_F.value                       
                    header = construct_header(type=type, total_fragments=total_fragments, data_length=len(fragment), fragment_number=fragment_number, checksum=crc_hqx(fragment, 0xFFFF))
                    
                    packet = header + fragment

                    self.is_pending = True

                    if fragment_number in [3, 6, 9]:
                        corrupted_packet = header + simulate_corruption(fragment)
                        self.sending_socket.sendto(corrupted_packet, (self.ongoing_address))
                    else:
                        self.sending_socket.sendto(packet, (self.ongoing_address))
                        
                    self.last_sent_packet = packet
                    
                    self.last_action_ts = time.time()
                    self.packet_sent_ts = time.time()

                    success = self.wait_for_response()

                    if not success or not self.is_connected:
                        self.is_pending = False
                        return
                    
                    fragment_number += 1
                    
            else:
                type = TYPE.FILE.value if is_file else TYPE.TEXT.value
                
                header = construct_header(type=type, data_length=len(data), checksum=crc_hqx(data, 0xFFFF))
                packet = header + data

                self.is_pending = True
                self.sending_socket.sendto(packet, (self.ongoing_address))
                self.last_sent_packet = packet
                
                self.last_action_ts = time.time()
                self.packet_sent_ts = time.time()

                self.wait_for_response()

    def wait_for_response(self):
        sent = 0

        while self.is_pending and self.is_connected:
            if time.time() - self.packet_sent_ts >= 5:

                if sent == 3:
                    self.print_on_thread('\n[RESPONSE] No Response. Connection Terminated.\n')
                    self.is_connected = False
                    return False

                self.sending_socket.sendto(self.last_sent_packet, (self.ongoing_address))
                self.packet_sent_ts = time.time()
                
                sent += 1

        return True
    
    def send_keep_alive(self):
        while True:
            if time.time() - self.last_action_ts >= 5 and self.is_connected and not self.is_pending:
                sent = 0
                self.is_inactive = True
                
                while self.is_inactive and self.is_connected and not self.is_pending:
                    if sent == 3:
                        self.print_on_thread('\n[KEEP-ALIVE] No Response. Connection Terminated.\n>> ')
                        self.is_connected = False
                        break

                    header = construct_header(type=TYPE.KEEPALIVE.value, action=ACTION.ACK.value)
                    self.sending_socket.sendto(header, self.ongoing_address)
                    
                    sent += 1
                    time.sleep(5)
            
            time.sleep(1)

    def establish_connection(self, message):
        if message['action'] == ACTION.SYN.value:
            header = construct_header(type=TYPE.HANDSHAKE.value, action=ACTION.ACK.value)
            self.sending_socket.sendto(header, (self.ongoing_address))
            
            self.connection_established = HANDSHAKE.PENDING.value
        
        if message['action'] == ACTION.ACK.value:
            if self.connection_established == HANDSHAKE.NOT_INITIATED.value:
                header = construct_header(type=TYPE.HANDSHAKE.value, action=ACTION.ACK.value)
                self.sending_socket.sendto(header, (self.ongoing_address))
                
            self.connection_established = HANDSHAKE.ESTABLISHED.value

    def close_connection(self, message):
        if message['action'] == ACTION.FIN.value:
            header = construct_header(type=TYPE.CLOSE.value, action=ACTION.ACK.value)
            self.sending_socket.sendto(header, (self.ongoing_address))
            
            self.connection_terminated = CLOSE.PENDING.value
        
        if message['action'] == ACTION.ACK.value:
            if self.connection_terminated == CLOSE.NOT_INITIATED.value:
                header = construct_header(type=TYPE.CLOSE.value, action=ACTION.ACK.value)
                self.sending_socket.sendto(header, (self.ongoing_address))
                
            self.connection_terminated = CLOSE.CLOSED.value

    def print_on_thread(self, output=False):
        if output:
            sys.stdout.write(output)

def construct_header(type=0, action=0, total_fragments=0, data_length=0, fragment_number=0, checksum=0):
    type_and_action = (type << 4) | (action & 0x0F)

    if type == TYPE.FILE.value or type == TYPE.TEXT.value:
        header = struct.pack('!BHH', type_and_action, data_length, checksum)
    elif type == TYPE.FILE_F.value or type == TYPE.TEXT_F.value:
        header = struct.pack('!BHHII', type_and_action, data_length, checksum, fragment_number, total_fragments)
    else:
        header = struct.pack('!B', type_and_action)

    return header

def unpack_packet(packet):
    data_length = 0
    checksum = 0
    fragment_number = 0
    total_fragments = 0
    data = 0

    type_and_action = int(packet[0])

    type = type_and_action >> 4
    action = type_and_action & 0x0F
    
    if type == TYPE.FILE.value or type == TYPE.TEXT.value:
        _, data_length, checksum = struct.unpack('!BHH', packet[:5])
        data = packet[5:]

    elif type == TYPE.FILE_F.value or type == TYPE.TEXT_F.value:
        _, data_length, checksum, fragment_number, total_fragments = struct.unpack('!BHHII', packet[:13])
        data = packet[13:]

    response = {
        'type': type,
        'action': action,
        'data_length': data_length,
        'checksum': checksum,
        'fragment_number': fragment_number,
        'total_fragments': total_fragments,
        'data': data
    }

    return response

def check_integrity(checksum, data):
        crc = crc_hqx(data, 0xFFFF)

        if crc == checksum:
            return True
        else:
            return False

def save_file(filepath, file_buffer):
    file_data = b''.join(file_buffer[i] for i in range(1, len(file_buffer) + 1))

    if not filepath:
        length_of_filename = int(file_data[0])
        
        filename = file_data[1: 1 + length_of_filename].decode()
        filepath = os.path.join(peer.filepath, filename)

        file_data = file_data[1 + length_of_filename:]
    
    try:
        directory = os.path.dirname(filepath)
        
        if not os.path.exists(directory):
            os.makedirs(directory, exist_ok=True)
        
        with open(filepath, 'wb') as file:
            file.write(file_data)
        
        peer.print_on_thread(f'\n[SAVED] File {os.path.basename(filepath)} of {len(file_data)}B saved to {os.path.abspath(os.path.dirname(filepath))}\n>> ')
    
    except (OSError):
        peer.print_on_thread(f'[ERROR] Failed to save file {os.path.basename(filepath)}\n>> ')

def simulate_corruption(data):
    data = bytearray(data)
    data[0] ^= 0xFF
    
    return bytes(data)

def configure_peer():
    print('\n================ CONFIGURATION =================\n')
    
    configured = False
    
    while not configured:
        try:
            host = input('[CONFIG] Enter current host: ')
            ipaddress.ip_address(host)
            
            port = int(input('[CONFIG] Enter current port: '))

            if 0 <= port <= 1023:
                print('[ERROR] Using reserved ports is unavailable.')
                raise ValueError
            
            ongoing_host = input('\n[CONFIG] Enter ongoing host: ')
            ipaddress.ip_address(ongoing_host)

            ongoing_port = int(input('[CONFIG] Enter ongoing port: '))

            if 0 <= ongoing_port <= 1023:
                print('[ERROR] Using reserved ports is unavailable.')
                raise ValueError

            if host == ongoing_host and port == ongoing_port:
                print('[ERROR] Current and ongoing peer parameters can not be same.')
                raise ValueError
            
            fragment_size = int(input('\n[CONFIG] Enter maximal fragment size (1 - 1459): '))

            if not 0 < fragment_size <= 1459:
                print('[ERROR] Fragment size is not in specified interval.')
                raise ValueError
            
            download_path = input('[CONFIG] Enter download filepath: ')
            download_path = os.path.normpath(download_path)

            if not os.path.isdir(download_path):
                os.makedirs(download_path, exist_ok=True)
            
            configured = True

        except (ValueError, OSError, OverflowError, PermissionError):
            print('[ERROR] Invalid value. Try again.\n')
    
    return host, port, ongoing_host, ongoing_port, fragment_size, download_path

def print_help():
    print('\n==================== HELP ======================\n')
    print('m\t-\tSend Text Message')
    print('f\t-\tSend File')
    print('c\t-\tConfigure Parameters')
    print('e\t-\tEnd Connection')
    print('h\t-\tShow Help')
    print('t\t-\tTerminate Program\n')

if __name__ == '__main__':
    config = configure_peer()
    peer = Peer(*config)

    listening_thread = threading.Thread(target=peer.start_listening, daemon=True)
    listening_thread.start()
    
    header = construct_header(type=TYPE.HANDSHAKE.value, action=ACTION.SYN.value)
    peer.sending_socket.sendto(header, (peer.ongoing_address))
    handshake_sent_ts = time.time()
    
    while not peer.is_connected:
        if time.time() - handshake_sent_ts >= 120:
            print('[CONNECTING...] No Initial Connection.')
            print('\n[END] Program Terminated.\n')
            sys.exit(0)
        
        time.sleep(1)

    sending_thread = threading.Thread(target=peer.send_message, daemon=True)
    sending_thread.start()

    connection_thread = threading.Thread(target=peer.send_keep_alive, daemon=True)
    connection_thread.start()

    print_thread = threading.Thread(target=peer.print_on_thread, daemon=True)
    print_thread.start()

    print()
    print_help()

    while True:
        command = input('>> ')

        if command not in ['m', 'f', 'c', 'e', 'h', 't']:
            print('Invalid command.')
            continue
        
        if not peer.is_connected and command != 't':
            print('Connection is not established. Press \'t\' to end or wait for new connection.')
            continue

        elif command == 'm':
            message = input('Type your message: ')

            if len(message.strip()) == 0:
                print('Invalid message.')
                continue

            peer.send_message(message=message)

        elif command == 'f':
            filepath = input('Enter path to your file: ')

            if len(filepath.strip()) == 0:
                print('Invalid filepath.')
                continue

            peer.send_message(message=filepath, is_file=True)

        elif command == 'c':
            try:
                size = int(input('Enter new fragment size: '))
                filepath = input('Enter new filepath: ').strip()

                filepath = os.path.normpath(filepath)
            
            except (ValueError, OSError):
                print('Invalid format.')
                continue

            if not 0 < size <= 1459:
                print('Invalid size. Size was not changed.')
            else:
                peer.fragment_size = size

            try:
                if not os.path.isdir(filepath):
                    os.makedirs(filepath, exist_ok=True)
            except OSError:
                print('Invalid filepath. Filepath was not changed.')
                continue
            
            peer.filepath = filepath
            
        elif command == 'e':
            if peer.is_connected:
                peer.initiated_close = True
                
                header = construct_header(type=TYPE.CLOSE.value, action=ACTION.FIN.value)
                peer.sending_socket.sendto(header, peer.ongoing_address)
                
                while peer.is_connected:
                    time.sleep(1)

        elif command == 'h':
            print_help()

        elif command == 't':
            if peer.is_connected:
                print('[ERROR] Connection is active. Could not terminate.')
            else:
                print('\n[END] Program Terminated.\n')
                sys.exit(0)

        time.sleep(1)