import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface Screen {
  id: string;
  product: string;
  width: number[];
  net_price_0_5k: number;
  net_price_5k_20k: number;
  net_price_20k_plus: number;
}

interface ScreenConfiguration {
  id?: string;
  screen_id: string;
  screen_width: string;
  screen_type: string;
  calculated_quantity: number;
  slitting_fee: number;
}

interface ScreenConfigurationsProps {
  screens: Screen[];
  vents: any[];
  ventId?: string;
  configurations: ScreenConfiguration[];
  ventSize?: number;
  ventLength?: number;
  ventQuantity?: number;
  houseWidth?: number;
  eaveHeight?: number;
  onChange: (configurations: ScreenConfiguration[]) => void;
}

const SCREEN_TYPES = [
  'Gothic Roof',
  'Insulator Roof',
  'Pad Vent',
  'Solar Light Double',
  'Solar Light Single',
  'Wall Vent',
  'Roll Up Wall Gtr EW',
  'Roll Up Wall Guttered',
  'Roll Up Wall Quonset'
] as const;

export function ScreenConfigurations({
  screens,
  vents,
  ventId,
  configurations,
  ventSize,
  ventLength,
  ventQuantity,
  houseWidth,
  eaveHeight,
  onChange
}: ScreenConfigurationsProps) {
  const calculateScreenQuantity = (
    screenWidth: number,
    ventSize: number = 0,
    length: number = 0,
    ventQuantity: number = 1,
    screenType: string = '',
    isDouble: boolean = false
  ): number => {
    if (!screenWidth || !ventSize || !length || !ventQuantity) {
      return 0;
    }

    console.log('Calculation inputs:', {
      screenWidth,
      ventSize,
      length,
      ventQuantity,
      screenType,
      isDouble
    });

    // Convert vent size from inches to feet
    const ventSizeInFeet = ventSize / 12;

    // For double vents, one screen width can cover two vents after slitting
    const effectiveVentSize = isDouble ? ventSizeInFeet * 2 : ventSizeInFeet;

    // Calculate total area needed for all vents
    const totalAreaNeeded = effectiveVentSize * length * ventQuantity;
    console.log('Total area needed:', totalAreaNeeded);

    // Calculate minimum area based on minimum screen width
    const minimumArea = screenWidth * length;
    console.log('Minimum area:', minimumArea);

    // Use the larger of the calculated area or minimum area
    // For multiple vents, we need at least minimumArea * number of vents
    const finalArea = Math.max(totalAreaNeeded, minimumArea * ventQuantity);
    console.log('Final area:', finalArea);

    return finalArea;
  };

  const handleAddConfiguration = () => {
    const newConfig: ScreenConfiguration = {
      screen_id: screens[0]?.id || '',
      screen_width: screens[0]?.width[0]?.toString() || '',
      screen_type: SCREEN_TYPES[0],
      calculated_quantity: 0,
      slitting_fee: 0
    };

    onChange([...configurations, newConfig]);
  };

  const handleUpdateConfiguration = (index: number, updates: Partial<ScreenConfiguration>) => {
    const newConfigs = [...configurations];
    newConfigs[index] = {
      ...newConfigs[index], 
      ...updates,
      slitting_fee: 0.22 // Set default slitting fee
    };

    // Get current configuration
    const currentConfig = newConfigs[index];
    const selectedVent = vents.find(v => v.id === ventId);
    const screenWidth = parseFloat(currentConfig.screen_width);

    if (screenWidth && selectedVent && ventLength && ventQuantity) {
      const isDouble = selectedVent.single_double === 'Double';
      const totalLength = ventLength * ventQuantity;

      console.log('Calculating with:', {
        screenWidth,
        ventSize: selectedVent.size,
        ventLength,
        ventQuantity,
        screenType: currentConfig.screen_type,
        isDouble,
        totalLength
      });

      newConfigs[index].calculated_quantity = calculateScreenQuantity(
        screenWidth,
        selectedVent.size,
        ventLength,
        ventQuantity,
        currentConfig.screen_type,
        isDouble
      );
      
      // Calculate slitting fee based on total length
      newConfigs[index].slitting_fee = 0.22 * totalLength;
    }

    onChange(newConfigs);
  };

  const handleDeleteConfiguration = (index: number) => {
    const newConfigs = configurations.filter((_, i) => i !== index);
    onChange(newConfigs);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Set for Screen</h3>
        <button
          type="button"
          onClick={handleAddConfiguration}
          className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Screen
        </button>
      </div>

      <div className="space-y-4">
        {configurations.map((config, index) => (
          <div
            key={config.id || index}
            className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                value={config.screen_type}
                onChange={(e) => handleUpdateConfiguration(index, { screen_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {SCREEN_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Screen Product
              </label>
              <select
                value={config.screen_id}
                onChange={(e) => handleUpdateConfiguration(index, { screen_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Select Screen</option>
                {screens.map(screen => (
                  <option key={screen.id} value={screen.id}>
                    {screen.product}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Width
              </label>
              <select
                value={config.screen_width}
                onChange={(e) => handleUpdateConfiguration(index, { screen_width: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Select Width</option>
                {screens.find(s => s.id === config.screen_id)?.width.map((w: number) => (
                  <option key={w} value={w.toString()}>{w} ft</option>
                )) || []}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Calculated Quantity
              </label>
              <input
                type="number"
                value={config.calculated_quantity}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Slitting Fee
                <span className="text-xs text-gray-500 ml-1">($0.22/ft)</span>
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={config.slitting_fee}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button
                  type="button"
                  onClick={() => handleDeleteConfiguration(index)}
                  className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}