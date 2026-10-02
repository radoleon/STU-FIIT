import type { ConfigurationPreset, PresetEntry } from '@/models/Frame'
import { openDB, type IDBPDatabase } from 'idb'

const PRESETS_STORE = 'presets'
const DESCRIPTIONS_STORE = 'descriptions'

export class Persistence {
  private readonly _directoryName: string
  private _db: IDBPDatabase | null = null

  constructor(directoryName: string) {
    this._directoryName = directoryName
  }

  private _normalizePreset(preset: ConfigurationPreset): string {
    return JSON.stringify({
      variables: [...preset.variables].sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))),
      selectedOptions: [...preset.selectedOptions].sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))),
      constraints: [...preset.constraints].sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)))
    })
  }

  public async init(): Promise<void> {
    this._db = await openDB(this._directoryName, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(PRESETS_STORE)) {
          db.createObjectStore(PRESETS_STORE)
        }
        if (!db.objectStoreNames.contains(DESCRIPTIONS_STORE)) {
          db.createObjectStore(DESCRIPTIONS_STORE)
        }
      }
    })
  }

  public async clear(): Promise<void> {
    await this._db!.clear(PRESETS_STORE)
    await this._db!.clear(DESCRIPTIONS_STORE)
  }

  public async isPresetSaved(current: ConfigurationPreset, name: string): Promise<string | null> {
    const value = await this._db!.get(PRESETS_STORE, name)

    if (value) {
      return `Preset with name "${name}" for this project already exists`
    }

    const keys = await this._db!.getAllKeys(PRESETS_STORE)
    const presets: ConfigurationPreset[] = await this._db!.getAll(PRESETS_STORE)

    const currentNormalized = this._normalizePreset(current)

    const index = presets.findIndex(preset => this._normalizePreset(preset) === currentNormalized)

    if (index !== -1) {
      return `Preset with same configuration is already saved as "${keys[index]}"`
    }

    return null
  }

  public async savePreset(name: string, preset: ConfigurationPreset): Promise<void> {
    await this._db!.put(PRESETS_STORE, preset, name)
  }

  public async getAllPresets(): Promise<PresetEntry[]> {
    const keys = await this._db!.getAllKeys(PRESETS_STORE)
    const presets: ConfigurationPreset[] = await this._db!.getAll(PRESETS_STORE)

    return keys.map((key, i) => ({ key: String(key), preset: presets[i] }))
  }

  public async deletePreset(key: string): Promise<void> {
    await this._db!.delete(PRESETS_STORE, key)
  }

  public async saveDescription(key: string, text: string): Promise<void> {
    await this._db!.put(DESCRIPTIONS_STORE, text, key)
  }

  public async getDescription(key: string): Promise<string | null> {
    const desc = await this._db!.get(DESCRIPTIONS_STORE, key)
    return desc ?? null
  }

  public close(): void {
    this._db!.close()
    this._db = null
  }
}
