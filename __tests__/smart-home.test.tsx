import { DeviceState } from '../src/store/devicesSlice';

// Simple unit tests for Smart Home functionality
describe('Smart Home Components', () => {
  describe('DeviceState Interface', () => {
    it('should have correct device state structure', () => {
      const mockDevice: DeviceState = {
        id: 'test_light',
        name: 'Test Light',
        type: 'switch',
        state: 'on',
        value: 75,
        lastUpdated: new Date().toISOString(),
        isOnline: true,
      };

      expect(mockDevice.id).toBe('test_light');
      expect(mockDevice.name).toBe('Test Light');
      expect(mockDevice.type).toBe('switch');
      expect(mockDevice.state).toBe('on');
      expect(mockDevice.value).toBe(75);
      expect(mockDevice.isOnline).toBe(true);
    });

    it('should support different device types', () => {
      const switchDevice: DeviceState = {
        id: 'switch1',
        name: 'Switch',
        type: 'switch',
        state: 'off',
        lastUpdated: new Date().toISOString(),
        isOnline: true,
      };

      const temperatureDevice: DeviceState = {
        id: 'temp1',
        name: 'Thermostat',
        type: 'temperature',
        state: 'on',
        value: 72,
        lastUpdated: new Date().toISOString(),
        isOnline: true,
      };

      expect(switchDevice.type).toBe('switch');
      expect(temperatureDevice.type).toBe('temperature');
      expect(temperatureDevice.value).toBe(72);
    });
  });

  describe('Device Filtering Logic', () => {
    const mockDevices: DeviceState[] = [
      {
        id: 'light1',
        name: 'Living Room Light',
        type: 'switch',
        state: 'on',
        lastUpdated: new Date().toISOString(),
        isOnline: true,
      },
      {
        id: 'temp1',
        name: 'Thermostat',
        type: 'temperature',
        state: 'on',
        value: 72,
        lastUpdated: new Date().toISOString(),
        isOnline: true,
      },
      {
        id: 'light2',
        name: 'Bedroom Light',
        type: 'dimmer',
        state: 'off',
        value: 0,
        lastUpdated: new Date().toISOString(),
        isOnline: false,
      },
    ];

    it('should filter light devices correctly', () => {
      const lightDevices = mockDevices.filter(d => d.type === 'switch' || d.type === 'dimmer');
      expect(lightDevices).toHaveLength(2);
      expect(lightDevices[0].id).toBe('light1');
      expect(lightDevices[1].id).toBe('light2');
    });

    it('should filter temperature devices correctly', () => {
      const temperatureDevices = mockDevices.filter(d => d.type === 'temperature');
      expect(temperatureDevices).toHaveLength(1);
      expect(temperatureDevices[0].id).toBe('temp1');
    });

    it('should count online devices correctly', () => {
      const onlineDevices = mockDevices.filter(d => d.isOnline);
      expect(onlineDevices).toHaveLength(2);
    });

    it('should count active devices correctly', () => {
      const activeDevices = mockDevices.filter(d => d.state === 'on');
      expect(activeDevices).toHaveLength(2);
    });
  });
});
