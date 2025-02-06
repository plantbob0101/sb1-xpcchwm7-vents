import React from 'react';
import { Plus, Pencil, Trash2, X, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Model {
  id: string;
  name: string;
  description: string | null;
  gutter_connect: boolean;
}

interface Configuration {
  id: string;
  model_id: string;
  width: string;
  load: string;
  spacing?: string;
  glazing: string;
  eave: string;
}

export function ModelManager() {
  const [models, setModels] = React.useState<Model[]>([]);
  const [configurations, setConfigurations] = React.useState<Configuration[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [editingModel, setEditingModel] = React.useState<Model | null>(null);
  const [showAddConfig, setShowAddConfig] = React.useState<string | null>(null);
  const [editingConfig, setEditingConfig] = React.useState<Configuration | null>(null);
  const [newConfig, setNewConfig] = React.useState({
    width: '',
    load: '',
    spacing: '',
    glazing: '', 
    eave: ''
  });

  // Fetch models and their configurations
  const fetchModels = async () => {
    try {
      const { data: modelsData, error: modelsError } = await supabase
        .from('greenhouse_models')
        .select('*')
        .order('name');

      if (modelsError) throw modelsError;

      const { data: configsData, error: configsError } = await supabase
        .from('model_configurations')
        .select('*');

      if (configsError) throw configsError;

      setModels(modelsData);
      setConfigurations(configsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchModels();
  }, []);

  const handleAddModel = async () => {
    try {
      const { data, error } = await supabase
        .from('greenhouse_models')
        .insert({
          name: 'New Model',
          description: '',
          gutter_connect: false
        })
        .select()
        .single();

      if (error) throw error;

      setModels(prev => [...prev, data]);
      setEditingModel(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleUpdateModel = async (model: Model) => {
    try {
      const { error } = await supabase
        .from('greenhouse_models')
        .update({
          name: model.name,
          description: model.description,
          gutter_connect: model.gutter_connect
        })
        .eq('id', model.id);

      if (error) throw error;

      setModels(prev => prev.map(m => m.id === model.id ? model : m));
      setEditingModel(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleDeleteModel = async (id: string) => {
    if (!confirm('Are you sure you want to delete this model and all its configurations?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('greenhouse_models')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setModels(prev => prev.filter(m => m.id !== id));
      setConfigurations(prev => prev.filter(c => c.model_id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleAddConfiguration = async (modelId: string) => {
    try {
      // Validate input values
      if (!newConfig.width || !newConfig.load || !newConfig.eave || !newConfig.glazing) {
        setError('All fields are required');
        return;
      }

      const { data, error } = await supabase
        .from('model_configurations')
        .insert({
          model_id: modelId,
          ...newConfig
        })
        .select()
        .single();

      if (error) throw error;

      setConfigurations(prev => [...prev, data]);
      setShowAddConfig(null);
      setNewConfig({ width: '', load: '', spacing: '', glazing: '', eave: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleUpdateConfiguration = async (config: Configuration) => {
    try {
      const { error } = await supabase
        .from('model_configurations')
        .update({
          width: config.width,
          load: config.load,
          spacing: config.spacing,
          glazing: config.glazing,
          eave: config.eave
        })
        .eq('id', config.id);

      if (error) throw error;

      setConfigurations(prev => prev.map(c => c.id === config.id ? config : c));
      setEditingConfig(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleDeleteConfiguration = async (id: string) => {
    try {
      const { error } = await supabase
        .from('model_configurations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setConfigurations(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
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
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Greenhouse Models</h2>
        <button
          onClick={handleAddModel}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Model
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-md">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {models.map(model => (
          <div key={model.id} className="bg-white rounded-lg shadow-lg p-6">
            {editingModel?.id === model.id ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Model Name
                  </label>
                  <input
                    type="text"
                    value={editingModel.name}
                    onChange={e => setEditingModel({ ...editingModel, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={editingModel.description || ''}
                    onChange={e => setEditingModel({ ...editingModel, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="gutter_connect"
                    checked={editingModel.gutter_connect}
                    onChange={e => setEditingModel({ ...editingModel, gutter_connect: e.target.checked })}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label htmlFor="gutter_connect" className="text-sm font-medium text-gray-700">
                    Gutter Connect
                  </label>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setEditingModel(null)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleUpdateModel(editingModel)}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    <Save className="h-5 w-5 mr-2" />
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {model.name}
                    </h3>
                    {model.description && (
                      <p className="text-gray-600 mt-1">{model.description}</p>
                    )}
                    {model.gutter_connect && (
                      <span className="inline-block mt-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        Gutter Connect
                      </span>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setEditingModel(model)}
                      className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                    >
                      <Pencil className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteModel(model.id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium text-gray-900">Configurations</h4>
                    <button
                      onClick={() => setShowAddConfig(model.id)}
                      className="flex items-center px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Configuration
                    </button>
                  </div>

                  {showAddConfig === model.id && (
                    <div className="bg-gray-50 p-4 rounded-md space-y-4">
                      <div className="grid grid-cols-4 gap-4">
                        <div className="col-span-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Width (ft)
                          </label>
                          <input
                            type="text"
                            value={newConfig.width}
                            onChange={e => setNewConfig({ ...newConfig, width: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="Enter width in feet"
                          />
                        </div>
                        <div className="col-span-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Snow/Wind Load
                          </label>
                          <input
                            type="text"
                            value={newConfig.load}
                            onChange={e => setNewConfig({ ...newConfig, load: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="Enter load value"
                          />
                        </div>
                        <div className="col-span-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Spacing
                          </label>
                          <input
                            type="text"
                            value={newConfig.spacing || ''}
                            onChange={e => setNewConfig({ ...newConfig, spacing: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="Enter spacing"
                          />
                        </div>
                        <div className="col-span-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Glazing
                          </label>
                          <input
                            type="text"
                            value={newConfig.glazing}
                            onChange={e => setNewConfig({ ...newConfig, glazing: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="Enter glazing type"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Eave Height (ft)
                          </label>
                          <input
                            type="text"
                            value={newConfig.eave}
                            onChange={e => setNewConfig({ ...newConfig, eave: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="Enter eave height in feet"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end space-x-3">
                        <button
                          onClick={() => {
                            setShowAddConfig(null);
                            setNewConfig({ width: '', load: '', spacing: '', glazing: '', eave: '' });
                          }}
                          className="px-3 py-1 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleAddConfiguration(model.id)}
                          className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Width (ft)</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Snow/Wind Load</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Spacing</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Glazing</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Eave Height (ft)</th>
                          <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {configurations
                          .filter(config => config.model_id === model.id)
                          .map(config => (
                            <tr key={config.id}>
                              {editingConfig?.id === config.id ? (
                                <>
                                  <td className="px-4 py-2">
                                    <input
                                      type="text"
                                      value={editingConfig.width || ''}
                                      onChange={e => setEditingConfig({ ...editingConfig, width: e.target.value })}
                                      className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                    />
                                  </td>
                                  <td className="px-4 py-2">
                                    <input
                                      type="text"
                                      value={editingConfig.load || ''}
                                      onChange={e => setEditingConfig({ ...editingConfig, load: e.target.value })}
                                      className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                    />
                                  </td>
                                  <td className="px-4 py-2">
                                    <input
                                      type="text"
                                      value={editingConfig.spacing || ''}
                                      onChange={e => setEditingConfig({ ...editingConfig, spacing: e.target.value })}
                                      className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                    />
                                  </td>
                                  <td className="px-4 py-2">
                                    <input
                                      type="text"
                                      value={editingConfig.glazing || ''}
                                      onChange={e => setEditingConfig({ ...editingConfig, glazing: e.target.value })}
                                      className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                      placeholder="Enter glazing type"
                                    />
                                  </td>
                                  <td className="px-4 py-2">
                                    <input
                                      type="text"
                                      value={editingConfig.eave || ''}
                                      onChange={e => setEditingConfig({ ...editingConfig, eave: e.target.value })}
                                      className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                    />
                                  </td>
                                  <td className="px-4 py-2 text-right space-x-2">
                                    <button
                                      onClick={() => handleUpdateConfiguration(editingConfig)}
                                      className="text-green-600 hover:text-green-700 transition-colors"
                                    >
                                      <Save className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => setEditingConfig(null)}
                                      className="text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  </td>
                                </>
                              ) : (
                                <>
                                  <td className="px-4 py-2 text-sm text-gray-900">{config.width}</td>
                                  <td className="px-4 py-2 text-sm text-gray-900">{config.load}</td>
                                  <td className="px-4 py-2 text-sm text-gray-900">{config.spacing}</td>
                                  <td className="px-4 py-2 text-sm text-gray-900">{config.glazing}</td>
                                  <td className="px-4 py-2 text-sm text-gray-900">{config.eave}</td>
                                  <td className="px-4 py-2 text-right space-x-2">
                                    <button
                                      onClick={() => setEditingConfig(config)}
                                      className="text-gray-400 hover:text-green-600 transition-colors"
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteConfiguration(config.id)}
                                      className="text-gray-400 hover:text-red-600 transition-colors"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  </td>
                                </>
                              )}
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}