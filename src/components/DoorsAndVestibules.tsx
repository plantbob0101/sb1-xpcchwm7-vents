import React from 'react';
import { Plus, X, Settings, DoorOpen as Door } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { DoorTypeManager } from './DoorTypeManager';
import { DoorsAndVestibulesForm } from './DoorsAndVestibulesForm';

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

export function DoorsAndVestibules({ projectId }: { projectId: string }) {
  const [showDoorTypeManager, setShowDoorTypeManager] = React.useState(false);
  const [doorTypes, setDoorTypes] = React.useState<DoorType[]>([]);
  const [doors, setDoors] = React.useState<Door[]>([]);
  const [vestibules, setVestibules] = React.useState<Vestibule[]>([]);
  const [freight, setFreight] = React.useState<FreightRequirements | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [showForm, setShowForm] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [showSuccess, setShowSuccess] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [doorsAndVestibulesId, setDoorsAndVestibulesId] = React.useState<string | null>(null);

  const fetchData = async () => {
    try {
      // Get or create doors_and_vestibules record
      const { data: existingRecord, error: recordError } = await supabase
        .from('doors_and_vestibules')
        .select('id')
        .eq('project_id', projectId);

      let recordId;
      
      if (!existingRecord?.length) {
        // Record doesn't exist, create it
        const { data: newRecord, error: createError } = await supabase
          .from('doors_and_vestibules')
          .insert({ project_id: projectId })
          .select()
          .single();

        if (createError) throw createError;
        recordId = newRecord.id;
      } else {
        recordId = existingRecord[0].id;
      }

      setDoorsAndVestibulesId(recordId);

      // Fetch door types
      const { data: doorTypesData, error: doorTypesError } = await supabase
        .from('door_types')
        .select('*')
        .order('type');

      if (doorTypesError) throw doorTypesError;
      setDoorTypes(doorTypesData);

      // Fetch doors
      const { data: doorsData, error: doorsError } = await supabase
        .from('doors')
        .select('id, door_type_id, door_covering, quantity')
        .eq('doors_and_vestibules_id', recordId);

      if (doorsError) throw doorsError;
      setDoors(doorsData || []);

      // Fetch vestibules
      const { data: vestibulesData, error: vestibulesError } = await supabase
        .from('vestibules')
        .select('id, dimensions, roof_covering, side_covering, door_type_id, pressure_fan')
        .eq('doors_and_vestibules_id', recordId);

      if (vestibulesError) throw vestibulesError;
      setVestibules(vestibulesData || []);

      // Fetch freight requirements
      const { data: freightData, error: freightError } = await supabase
        .from('freight_requirements')
        .select('id, aj_door_freight, glazing_freight, screen_freight')
        .eq('doors_and_vestibules_id', recordId)
        .maybeSingle();

      if (freightError) throw freightError;
      setFreight(freightData);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, [projectId]);

  const handleSave = async (values: {
    doors: Door[];
    vestibules: Vestibule[];
    freight: Partial<FreightRequirements>;
  }) => {
    setSaving(true);
    setError(null);
    try {
      // Update doors
      await supabase.from('doors').delete().eq('doors_and_vestibules_id', doorsAndVestibulesId);
      if (values.doors.length > 0) {
        await supabase.from('doors').insert(
          values.doors.map(door => ({
            ...door,
            doors_and_vestibules_id: doorsAndVestibulesId
          }))
        );
      }

      // Update vestibules
      await supabase.from('vestibules').delete().eq('doors_and_vestibules_id', doorsAndVestibulesId);
      if (values.vestibules.length > 0) {
        await supabase.from('vestibules').insert(
          values.vestibules.map(vestibule => ({
            ...vestibule,
            doors_and_vestibules_id: doorsAndVestibulesId
          }))
        );
      }

      // Update freight requirements
      if (freight) {
        await supabase
          .from('freight_requirements')
          .update(values.freight)
          .eq('id', freight.id);
      } else if (Object.keys(values.freight).length > 0) {
        await supabase
          .from('freight_requirements')
          .insert({
            ...values.freight,
            doors_and_vestibules_id: doorsAndVestibulesId
          });
      }

      await fetchData();
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Door className="h-6 w-6 text-green-600" />
          <h2 className="text-2xl font-bold text-gray-900">Doors and Vestibules</h2>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowDoorTypeManager(!showDoorTypeManager)}
            className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            title="Door Type Management"
          >
            <Settings className="h-5 w-5" />
          </button>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              Configure Doors & Vestibules
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-md">
          {error}
        </div>
      )}

      {showSuccess && (
        <div className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded z-50 flex items-center">
          <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Configuration saved successfully
        </div>
      )}

      {showDoorTypeManager && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">
              Door Type Management
            </h3>
            <button
              onClick={() => setShowDoorTypeManager(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <DoorTypeManager />
        </div>
      )}

      {showForm ? (
        <DoorsAndVestibulesForm
          doorTypes={doorTypes}
          existingDoors={doors}
          existingVestibules={vestibules}
          existingFreight={freight}
          onSubmit={handleSave}
          onCancel={() => setShowForm(false)}
          isLoading={saving}
        />
      ) : (
        <>
          {doors.length === 0 && vestibules.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-lg">
              <Door className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                No Doors or Vestibules Configured
              </h3>
              <p className="text-gray-500 mb-6">
                Click "Configure Doors & Vestibules" to start adding doors and vestibules to your greenhouse.
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                <Plus className="h-5 w-5 mr-2" />
                Configure Doors & Vestibules
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="space-y-8">
                {/* Doors Display */}
                {doors.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Doors</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {doors.map(door => {
                        const doorType = doorTypes.find(t => t.id === door.door_type_id);
                        return (
                          <div key={door.id} className="bg-gray-50 p-4 rounded-lg">
                            <div className="text-sm text-gray-500">Door Type</div>
                            <div className="text-lg font-medium mb-2">
                              {doorType ? `${doorType.type} - ${doorType.size}` : 'Unknown Type'}
                            </div>
                            <div className="text-sm text-gray-500">Covering</div>
                            <div className="text-lg font-medium mb-2">{door.door_covering}</div>
                            <div className="text-sm text-gray-500">Quantity</div>
                            <div className="text-lg font-medium">{door.quantity}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Vestibules Display */}
                {vestibules.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Vestibules</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {vestibules.map(vestibule => {
                        const doorType = doorTypes.find(t => t.id === vestibule.door_type_id);
                        return (
                          <div key={vestibule.id} className="bg-gray-50 p-4 rounded-lg">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <div className="text-sm text-gray-500">Dimensions</div>
                                <div className="text-lg font-medium mb-2">{vestibule.dimensions}</div>
                              </div>
                              <div>
                                <div className="text-sm text-gray-500">Door Type</div>
                                <div className="text-lg font-medium mb-2">
                                  {doorType ? `${doorType.type} - ${doorType.size}` : 'None'}
                                </div>
                              </div>
                              <div>
                                <div className="text-sm text-gray-500">Roof Covering</div>
                                <div className="text-lg font-medium mb-2">{vestibule.roof_covering}</div>
                              </div>
                              <div>
                                <div className="text-sm text-gray-500">Side Covering</div>
                                <div className="text-lg font-medium mb-2">{vestibule.side_covering}</div>
                              </div>
                              {vestibule.pressure_fan && (
                                <div className="col-span-2">
                                  <div className="text-sm text-gray-500">Pressure Fan</div>
                                  <div className="text-lg font-medium">{vestibule.pressure_fan}</div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Freight Requirements Display */}
                {freight && (
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Freight Requirements</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {freight.aj_door_freight && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="text-sm text-gray-500">AJ Door Freight</div>
                          <div className="text-lg font-medium">{freight.aj_door_freight}</div>
                        </div>
                      )}
                      {freight.glazing_freight && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="text-sm text-gray-500">Glazing Freight</div>
                          <div className="text-lg font-medium">{freight.glazing_freight}</div>
                        </div>
                      )}
                      {freight.screen_freight && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="text-sm text-gray-500">Screen Freight</div>
                          <div className="text-lg font-medium">{freight.screen_freight}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    onClick={() => setShowForm(true)}
                    className="text-gray-400 hover:text-green-600"
                    title="Edit Configuration"
                  >
                    <Settings className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}