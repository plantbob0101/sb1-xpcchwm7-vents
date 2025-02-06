import React from 'react';
import { Plus, Trash2, X } from 'lucide-react';

interface DoorType {
  id: string;
  type: string;
  size: string;
}

interface Door {
  id: string;
  door_type_id: string;
  door_covering: string;
  quantity: number;
}

interface Vestibule {
  id: string;
  dimensions: string;
  roof_covering: string;
  side_covering: string;
  door_type_id: string;
  pressure_fan: string;
}

interface FreightRequirements {
  id: string;
  aj_door_freight: string;
  glazing_freight: string;
  screen_freight: string;
}

const COVERING_OPTIONS = ['N/A', 'Poly', 'PC8', 'PC80%', 'CPC', 'MS', 'Insect Screen'] as const;

interface DoorsAndVestibulesFormProps {
  doorTypes: DoorType[];
  existingDoors: Door[];
  existingVestibules: Vestibule[];
  existingFreight: FreightRequirements | null;
  onSubmit: (values: {
    doors: Door[];
    vestibules: Vestibule[];
    freight: Partial<FreightRequirements>;
  }) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export function DoorsAndVestibulesForm({
  doorTypes,
  existingDoors,
  existingVestibules,
  existingFreight,
  onSubmit,
  onCancel,
  isLoading
}: DoorsAndVestibulesFormProps) {
  const [doors, setDoors] = React.useState<Door[]>(existingDoors);
  const [vestibules, setVestibules] = React.useState<Vestibule[]>(existingVestibules);
  const [freight, setFreight] = React.useState<Partial<FreightRequirements>>(existingFreight || {});

  const handleAddDoor = () => {
    const newDoor: Door = {
      id: crypto.randomUUID(),
      door_type_id: doorTypes[0]?.id || '',
      door_covering: COVERING_OPTIONS[0],
      quantity: 1
    };
    setDoors(prev => [...prev, newDoor]);
  };

  const handleUpdateDoor = (doorId: string, updates: Partial<Door>) => {
    setDoors(prev => prev.map(door => 
      door.id === doorId ? { ...door, ...updates } : door
    ));
  };

  const handleDeleteDoor = (doorId: string) => {
    setDoors(prev => prev.filter(door => door.id !== doorId));
  };

  const handleAddVestibule = () => {
    const newVestibule: Vestibule = {
      id: crypto.randomUUID(),
      dimensions: '',
      roof_covering: COVERING_OPTIONS[0],
      side_covering: COVERING_OPTIONS[0],
      door_type_id: doorTypes[0]?.id || '',
      pressure_fan: ''
    };
    setVestibules(prev => [...prev, newVestibule]);
  };

  const handleUpdateVestibule = (vestibuleId: string, updates: Partial<Vestibule>) => {
    setVestibules(prev => prev.map(vestibule =>
      vestibule.id === vestibuleId ? { ...vestibule, ...updates } : vestibule
    ));
  };

  const handleDeleteVestibule = (vestibuleId: string) => {
    setVestibules(prev => prev.filter(v => v.id !== vestibuleId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      doors,
      vestibules,
      freight
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Doors Section */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Doors</h3>
          <button
            type="button"
            onClick={handleAddDoor}
            className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Door
          </button>
        </div>

        <div className="space-y-4">
          {doors.map(door => (
            <div key={door.id} className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Door Type
                </label>
                <select
                  value={door.door_type_id}
                  onChange={(e) => handleUpdateDoor(door.id, { door_type_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {doorTypes.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.type} - {type.size}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Door Covering
                </label>
                <select
                  value={door.door_covering}
                  onChange={(e) => handleUpdateDoor(door.id, { door_covering: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {COVERING_OPTIONS.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  value={door.quantity}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (!isNaN(value) && value > 0) {
                      handleUpdateDoor(door.id, { quantity: value });
                    }
                  }}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="flex items-end justify-end">
                <button
                  type="button"
                  onClick={() => handleDeleteDoor(door.id)}
                  className="text-gray-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Vestibules Section */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Vestibules</h3>
          <button
            type="button"
            onClick={handleAddVestibule}
            className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Vestibule
          </button>
        </div>

        <div className="space-y-4">
          {vestibules.map(vestibule => (
            <div key={vestibule.id} className="p-4 bg-gray-50 rounded-lg space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dimensions
                  </label>
                  <input
                    type="text"
                    value={vestibule.dimensions}
                    onChange={(e) => handleUpdateVestibule(vestibule.id, { dimensions: e.target.value })}
                    placeholder="Enter dimensions"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Roof Covering
                  </label>
                  <select
                    value={vestibule.roof_covering}
                    onChange={(e) => handleUpdateVestibule(vestibule.id, { roof_covering: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    {COVERING_OPTIONS.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Side Covering
                  </label>
                  <select
                    value={vestibule.side_covering}
                    onChange={(e) => handleUpdateVestibule(vestibule.id, { side_covering: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    {COVERING_OPTIONS.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Door Type
                  </label>
                  <select
                    value={vestibule.door_type_id}
                    onChange={(e) => handleUpdateVestibule(vestibule.id, { door_type_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select Door Type</option>
                    {doorTypes.map(type => (
                      <option key={type.id} value={type.id}>
                        {type.type} - {type.size}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pressure Fan
                  </label>
                  <input
                    type="text"
                    value={vestibule.pressure_fan}
                    onChange={(e) => handleUpdateVestibule(vestibule.id, { pressure_fan: e.target.value })}
                    placeholder="Enter pressure fan details"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => handleDeleteVestibule(vestibule.id)}
                  className="text-gray-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Freight Requirements Section */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Freight Requirements</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              AJ Door Freight
            </label>
            <input
              type="text"
              value={freight.aj_door_freight || ''}
              onChange={(e) => setFreight(prev => ({ ...prev, aj_door_freight: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Glazing Freight
            </label>
            <input
              type="text"
              value={freight.glazing_freight || ''}
              onChange={(e) => setFreight(prev => ({ ...prev, glazing_freight: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Screen Freight
            </label>
            <input
              type="text"
              value={freight.screen_freight || ''}
              onChange={(e) => setFreight(prev => ({ ...prev, screen_freight: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
              Saving...
            </>
          ) : (
            'Save Configuration'
          )}
        </button>
      </div>
    </form>
  );
}