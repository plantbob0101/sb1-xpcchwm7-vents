import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface Drive {
  id: string;
  drive_type: string;
  motor: string;
  size: number;
  greenhouse_type: string;
}

interface DriveConfiguration {
  id?: string;
  drive_id: string;
  quantity: number;
}

interface DriveConfigurationsProps {
  drives: Drive[];
  configurations: DriveConfiguration[];
  ventType?: string;
  ventLength?: number;
  onChange: (configurations: DriveConfiguration[]) => void;
}

export function DriveConfigurations({
  drives,
  configurations,
  ventType,
  ventLength,
  onChange
}: DriveConfigurationsProps) {
  const filteredDrives = React.useMemo(() => {
    if (!ventType || !ventLength) return drives;

    // Map vent types to compatible drive types
    const driveTypeMap: Record<string, string[]> = {
      'CT Roof': ['Roof Vents'],
      'Gothic Roof': ['Roof Vents'],
      'Insulator Roof': ['Roof Vents'],
      'Oxnard Vent': ['Wall Vents'],
      'Pad': ['Pad Vent'],
      'Solar Light Roof': ['Roof Vents'],
      'Wall': ['Wall Vents']
    };

    return drives.filter(drive => {
      // Drive size must be greater than or equal to the vent length if both exist
      const sizeCheck = ventLength ? drive.size >= ventLength : true;

      // Drive must be compatible with the vent type
      const compatibleDriveTypes = driveTypeMap[ventType] || [];
      const typeCheck = compatibleDriveTypes.includes(drive.drive_type);

      return sizeCheck && typeCheck;
    });
  }, [drives, ventType, ventLength]);

  const handleAddConfiguration = () => {
    const newConfig: DriveConfiguration = {
      drive_id: filteredDrives[0]?.id || '',
      quantity: 1
    };

    onChange([...configurations, newConfig]);
  };

  const handleUpdateConfiguration = (index: number, updates: Partial<DriveConfiguration>) => {
    const newConfigs = [...configurations];
    newConfigs[index] = {
      ...newConfigs[index],
      ...updates
    };
    onChange(newConfigs);
  };

  const handleDeleteConfiguration = (index: number) => {
    const newConfigs = configurations.filter((_, i) => i !== index);
    onChange(newConfigs);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Drive Configuration</h3>
        <button
          type="button"
          onClick={handleAddConfiguration}
          className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Drive
        </button>
      </div>

      <div className="space-y-4">
        {configurations.map((config, index) => (
          <div
            key={config.id || index}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Drive Type
              </label>
              <select
                value={config.drive_id}
                onChange={(e) => handleUpdateConfiguration(index, { drive_id: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Select Drive</option>
                {filteredDrives.map(drive => (
                  <option key={drive.id} value={drive.id}>
                    {drive.drive_type} - {drive.motor} ({drive.size} ft)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={config.quantity}
                  onChange={(e) => handleUpdateConfiguration(index, { quantity: parseInt(e.target.value) || 0 })}
                  min="1"
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