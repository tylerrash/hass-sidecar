import API from "../API"
import mqtt from 'mqtt'
import MQTT from '../mqtt'
import { ISubscriptionCallback } from '../mqtt';

type ICallback = () => void
abstract class Automation {

  private _timeouts: NodeJS.Timeout[] = []
  private _intervals: NodeJS.Timeout[] = []
  private _mqttSubscriptions: Map<string, number> = new Map()
  protected _api: API
  protected _mqtt: MQTT

  constructor () {
    this._api = API.getInstance()
    this._mqtt = MQTT.getInstance()
  }

  public begin () {
    this._timeouts = []
    this._intervals = []
  }

  mqttPublish (topic: string, payload: string, options?: mqtt.IClientPublishOptions) {
    this._mqtt.publish(topic, payload, options)
  }

  mqttSubscribe (topic: string, options: mqtt.IClientSubscribeOptions, callback: ISubscriptionCallback) {
    try {
      const sub = this._mqtt.subscribe(topic, options, callback)
      this._mqttSubscriptions.set(sub.topic, sub.id)
    } catch (e) {
      console.error(e)
    }
  }

  setTimeout (callback: ICallback, milliseconds: number) {
    const id = setTimeout(callback, milliseconds)
    this._timeouts.push(id)
  }

  clearTimeout (id: NodeJS.Timeout) {
    clearTimeout(id)
    const idx = this._timeouts.indexOf(id)
    this._timeouts.splice(idx, 1)
  }

  setInterval (callback: ICallback, milliseconds: number) {
    const id = setInterval(callback, milliseconds)
    this._intervals.push(id)
  }

  clearInterval (id: NodeJS.Timeout) {
    clearInterval(id)
    const idx = this._intervals.indexOf(id)
    this._intervals.splice(idx, 1)
  }

  destroy () {
    // Destroy all timeouts
    for (let i = this._timeouts.length - 1; i >= 0; i--) {
      console.log(`Destroying timeout ${this._timeouts[i]}`)
      this.clearTimeout(this._timeouts[i])
    }

    // Destroy all intervals
    for (let i = this._intervals.length - 1; i >= 0; i--) {
      console.log(`Destroying interval ${this._intervals[i]}`)
      this.clearInterval(this._intervals[i])
    }

    // Unsubscribe mqtt
    Array.from(this._mqttSubscriptions).forEach((value) => {
      console.log(`Unsubscribing from mqtt topic: ${value[0]} with id ${value[1]}`)
      this._mqtt.unsubscribe(value[0], value[1])
    })
    this._mqttSubscriptions = new Map()
    console.log('Destroyed')
  }
}

export { Automation }