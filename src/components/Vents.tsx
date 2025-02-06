import React from 'react';
import { Wind, Plus, X, Settings, Trash2, Cog } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { VentForm } from './VentForm';
import { VentTypeManager } from './VentTypeManager';
import { DriveTypeManager } from './DriveTypeManager';

interface VentsProps {
  projectId: string;
}

export function Vents({ projectId }: VentsProps) {
  const [showVentTypeManager, setShowVentTypeManager] = React.useState(false);
  const [showDriveTypeManager, setShowDriveTypeManager] = React.useState(false);
  const [ventConfigurations, setVentConfigurations] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showForm, setShowForm] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [showSuccess, setShowSuccess] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [editingConfiguration, setEditingConfiguration] = React.useState<any>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetchVentConfigurations();
  }, [projectId]);

  const fetchVentConfigurations = async () => {
    try {
      const { data: configurations, error: configError } = await supabase
        .from('vent_configurations')
        .select(`
          *,
          vents (*),
          screen_configurations (
            id,
            screen_id,
            screen_type,
            calculated_quantity,
            slitting_fee,
            screens (*)
          ),
          drive_configurations (
            *,
            drives (*)
          ),
          vent_freight_requirements (*)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (configError) throw configError;
      setVentConfigurations(configurations || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (values: any) => {
    setSaving(true);
    setError(null);

    try {
      // First, save the main vent configuration
      const { data: ventConfig, error: ventError } = await supabase
        .from('vent_configurations')
        .upsert({
          project_id: projectId,
          ...values.ventConfiguration
        })
        .select()
        .single();

      if (ventError) throw ventError;

      // Save screen configurations
      if (values.screenConfigurations?.length > 0) {
        const screenData = values.screenConfigurations.map((screen: any) => ({
          ...screen,
          vent_configuration_id: ventConfig.id
        }));

        const { error: screenError } = await supabase
          .from('screen_configurations')
          .upsert(screenData);

        if (screenError) throw screenError;
      }

      // Save drive configurations
      if (values.driveConfigurations?.length > 0) {
        const driveData = values.driveConfigurations.map((drive: any) => ({
          ...drive,
          vent_configuration_id: ventConfig.id
        }));

        const { error: driveError } = await supabase
          .from('drive_configurations')
          .upsert(driveData);

        if (driveError) throw driveError;
      }

      // Save freight requirements
      if (values.freightRequirements) {
        const { error: freightError } = await supabase
          .from('vent_freight_requirements')
          .upsert({
            ...values.freightRequirements,
            vent_configuration_id: ventConfig.id
          });

        if (freightError) throw freightError;
      }

      await fetchVentConfigurations();
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      setShowForm(false);
      setEditingConfiguration(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this configuration?')) {
      return;
    }

    setDeletingId(id);
    setError(null);

    try {
      // Delete related records first
      await Promise.all([
        supabase
          .from('screen_configurations')
          .delete()
          .eq('vent_configuration_id', id),
        supabase
          .from('drive_configurations')
          .delete()
          .eq('vent_configuration_id', id),
        supabase
          .from('vent_freight_requirements')
          .delete()
          .eq('vent_configuration_id', id)
      ]);

      // Then delete the main configuration
      const { error: deleteError } = await supabase
        .from('vent_configurations')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      await fetchVentConfigurations();
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
      </div>
    );
  }


  const handleAddConfiguration = () => {
    setEditingConfiguration(null);
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Wind className="h-6 w-6 text-green-600" />
          <h2 className="text-2xl font-bold text-gray-900">Vents Configuration</h2>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowDriveTypeManager(!showDriveTypeManager)}
            className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            title="Drive Type Management"
          >
            <Cog className="h-5 w-5" />
          </button>
          <button
            onClick={() => setShowVentTypeManager(!showVentTypeManager)}
            className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            title="Vent Type Management"
          >
            <Settings className="h-5 w-5" />
          </button>
          <button
            onClick={() => {
              handleAddConfiguration();
            }}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Configuration
          </button>
        </div>
      </div>

      {showDriveTypeManager && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">
              Drive Type Management
            </h3>
            <button
              onClick={() => setShowDriveTypeManager(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <DriveTypeManager />
        </div>
      )}

      {showVentTypeManager && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">
              Vent Type Management
            </h3>
            <button
              onClick={() => setShowVentTypeManager(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <VentTypeManager />
        </div>
      )}

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

      {showForm ? (
        <VentForm
          projectId={projectId}
          existingConfiguration={editingConfiguration}
          onSubmit={handleSave}
          onCancel={() => {
            setShowForm(false);
            setEditingConfiguration(null);
          }}
          isLoading={saving}
        />
      ) : (
        <div className="space-y-6">
          {ventConfigurations.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-lg">
              <Wind className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                No Vent Configurations
              </h3>
              <p className="text-gray-500 mb-6">
                Click "Add Configuration" to start configuring your greenhouse vents.
              </p>
              <button
                onClick={handleAddConfiguration}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add Configuration
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {ventConfigurations.map((config) => (
                <div
                  key={config.id}
                  className="bg-white rounded-lg shadow-lg p-6"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {config.configuration_type}
                      </h3>
                      <div className="mt-4 space-y-4">
                        {config.vents && (
                          <div className="text-sm">
                            <span className="font-medium">Vent Type:</span>{' '}
                            {config.vents.type} - {config.vents.single_double} - {config.vents.size}"
                          </div>
                        )}
                        {config.vent_quantity && (
                          <div className="text-sm">
                            <span className="font-medium">Quantity:</span> {config.vent_quantity}
                          </div>
                        )}
                        {config.vent_length && (
                          <div className="text-sm">
                            <span className="font-medium">Length:</span> {config.vent_length} ft
                          </div>
                        )}
                        {config.screen_configurations?.length > 0 && (
                          <div className="mt-4">
                            <h4 className="font-medium mb-2">Screen Configurations:</h4>
                            <div className="space-y-2">
                              {config.screen_configurations.map((screen: any) => (
                                <div key={screen.id} className="text-sm">
                                  {screen.screens?.product} - {screen.screen_type} 
                                  {screen.calculated_quantity > 0 && (
                                    <span className="ml-2 text-gray-500">
                                      (Calculated: {screen.calculated_quantity.toFixed(2)} sq ft
                                      {screen.slitting_fee > 0 && ` | Slitting Fee: $${screen.slitting_fee.toFixed(2)}`})
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {config.drive_configurations?.length > 0 && (
                          <div className="mt-4">
                            <h4 className="font-medium mb-2">Drive Configurations:</h4>
                            <div className="space-y-2">
                              {config.drive_configurations.map((drive: any) => (
                                <div key={drive.id} className="text-sm">
                                  {drive.drives?.drive_type} - {drive.drives?.motor} ({drive.quantity})
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setEditingConfiguration(config);
                          setShowForm(true);
                        }}
                        className="text-gray-400 hover:text-green-600"
                        title="Edit Configuration"
                      >
                        <Settings className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(config.id)}
                        disabled={deletingId === config.id}
                        className={`text-gray-400 hover:text-red-600 ${deletingId === config.id ? 'opacity-50' : ''}`}
                        title="Delete Configuration"
                      >
                        {deletingId === config.id ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-red-600 border-t-transparent" />
                        ) : (
                          <Trash2 className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}