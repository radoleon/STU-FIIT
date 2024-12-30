## Custom Communication Protocol

This project implements a custom communication protocol between two devices. The protocol supports sending text and files, both fragmented and non-fragmented. Key features include:

- Reliable data transmission (Stop & Wait ARQ)
- Message integrity check with checksum
- Connection maintenance using keep-alive messages
- Text and file transfer support (fragmented and non-fragmented)

## Packet Structure

The protocol uses variable-sized packets depending on the message type. Below are the fields for the packet header:

| Field             | Description                                      | Size (bits)  |
|-------------------|--------------------------------------------------|--------------|
| **Type**          | Type of the message (e.g., TEXT, FILE, HANDSHAKE)| 4 bits       |
| **Action**        | Action or response (e.g., ACK, NACK, SYN)        | 4 bits       |
| **Data Length**   | Length of the data excluding the header         | 16 bits      |
| **Checksum**      | CRC value for error checking                    | 16 bits      |
| **Fragment Number**| The fragment sequence number                   | 32 bits       |
| **Total Fragments**| Total number of fragments for the data         | 32 bits       |

### Message Types

- **TEXT (0001)**: Sending text without fragmentation
- **FILE (0010)**: Sending a file without fragmentation
- **TEXT_F (0011)**: Sending fragmented text
- **FILE_F (0100)**: Sending fragmented file
- **HANDSHAKE (0101)**: Connection establishment
- **KEEPALIVE (0110)**: Connection check
- **CLOSE (0111)**: Terminating the connection

## Setup and Usage

### Configuration
To begin, configure both devices with matching addresses and ports. This ensures that the connection can be established correctly. Once configured, a connection handshake is initiated, followed by the ability to send messages and files.

### Commands
- `m`: Send a text message
- `f`: Send a file
- `c`: Configure parameters
- `e`: Terminate connection
- `h`: Display help
- `t`: Exit the program

### File Transfer
When sending a file, provide the absolute or relative path. The file's name is encoded, and the size is calculated before being sent. The file is received and stored with the same name on the recipient's side.

## Features
- **Connection Reliability**: Uses the Stop & Wait ARQ method to ensure data is correctly received.
- **Integrity Verification**: Checksums ensure data integrity during transmission.
- **Keep-Alive Mechanism**: Periodically sends keep-alive messages to maintain an active connection.
- **Text and File Transfer**: Allows sending both text and files with or without fragmentation.

## Technologies
![](https://skillicons.dev/icons?i=python)
