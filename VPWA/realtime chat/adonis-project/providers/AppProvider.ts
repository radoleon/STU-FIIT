import type { ApplicationContract } from '@ioc:Adonis/Core/Application'

export default class AppProvider {
  constructor (protected app: ApplicationContract) {
  }

  public register () {
    // Register your own bindings
  }

  public async boot () {
    // IoC container is ready
  }

  public async ready () {
    // App is ready — start background tasks like scheduler here
    try {
      const { startScheduler } = await import('../start/scheduler')
      startScheduler()
    } catch (err) {
      console.error('Failed to start scheduler:', err)
    }
  }

  public async shutdown () {
    // Cleanup, since app is going down
  }
}
