import SystemConfig, { ISystemConfig } from '~/models/systemConfig.model'

class SystemConfigsService {
  async getConfig(): Promise<ISystemConfig> {
    let config = await SystemConfig.findOne()
    if (!config) {
      config = await SystemConfig.create({})
    }
    return config
  }

  async updateConfig(data: Partial<ISystemConfig>): Promise<ISystemConfig> {
    let config = await SystemConfig.findOne()
    if (!config) {
      config = await SystemConfig.create(data)
    } else {
      Object.assign(config, data)
      await config.save()
    }
    return config
  }
}

export default new SystemConfigsService()
