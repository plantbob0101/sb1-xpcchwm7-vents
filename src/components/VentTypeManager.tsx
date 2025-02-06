import React from 'react';
import { Plus, Pencil, Trash2, X, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface VentType {
  id: string;
  type: string;
  single_double: string;
  size: number;
  vent_glazing: string;
}

const VENT_TYPES = [
  'CT Roof',
  'Gothic Roof',
  'Insulator Roof',
  'Oxnard Vent',
  'Pad',
  'Solar Light Roof',
  'Wall'
] as const;

const SINGLE_DOUBLE_OPTIONS = ['Single', 'Double'] as const;

export function VentTypeManager() {
  const [ventTypes, setVentTypes] = React.useState<VentType[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [editingType, setEditingType] = React.useState<VentType | null>(null);
  const [newType, setNewType] = React.useState({
    type: VENT_TYPES[0],
    single_double: SINGLE_DOUBLE_OPTIONS[0],
    size: 0,
    vent_glazing: ''
  });

  const fetchVentTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('vents')
        .select('*')
        .order('type', { ascending: true });

      if (error) throw error;
      setVentTypes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchVentTypes();
  }, []);

  const handleAddType = async () => {
    try {
      if (!newType.size) {
        setError('Size is required');
        return;
      }

      const { data, error } = await supabase
        .from('vents')
        .insert({
          type: newType.type,
          single_double: newType.single_double,
          size: newType.size,
          vent_glazing: newType.vent_glazing
        })
        .select()
        .single();

      if (error) throw error;

      setVentTypes(prev => [...prev, data]);
      setNewType({
        type: VENT_TYPES[0],
        single_double: SINGLE_DOUBLE_OPTIONS[0],
        size: 0,
        vent_glazing: ''
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleUpdateType = async (type: VentType) => {
    try {
      const { error } = await supabase
        .from('vents')
        .update({
          type: type.type,
          single_double: type.single_double,
          size: type.size,
          vent_glazing: type.vent_glazing
        })
        .eq('id', type.id);

      if (error) throw error;

      setVentTypes(prev => prev.map(t => t.id === type.id ? type : t));
      setEditingType(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleDeleteType = async (id: string) => {
    if (!confirm('Are you sure you want to delete this vent type?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('vents')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setVentTypes(prev => prev.filter(t => t.id !== id));
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
        <h2 className="text-2xl font-bold text-gray-900">Vent Types</h2>
        <div className="flex items-center space-x-4">
          <select
            value={newType.type}
            onChange={(e) => setNewType(prev => ({ ...prev, type: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {VENT_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <select
            value={newType.single_double}
            onChange={(e) => setNewType(prev => ({ ...prev, single_double: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {SINGLE_DOUBLE_OPTIONS.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <input
            type="number"
            value={newType.size || ''}
            onChange={(e) => setNewType(prev => ({ ...prev, size: parseInt(e.target.value) || 0 }))}
            placeholder="Size (inches)"
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <input
            type="text"
            value={newType.vent_glazing}
            onChange={(e) => setNewType(prev => ({ ...prev, vent_glazing: e.target.value }))}
            placeholder="Vent Glazing"
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button
            onClick={handleAddType}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Type
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-md">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Single/Double
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Size (inches)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vent Glazing
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {ventTypes.map(type => (
              <tr key={type.id}>
                {editingType?.id === type.id ? (
                  <>
                    <td className="px-6 py-4">
                      <select
                        value={editingType.type}
                        onChange={(e) => setEditingType({ ...editingType, type: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        {VENT_TYPES.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={editingType.single_double}
                        onChange={(e) => setEditingType({ ...editingType, single_double: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        {SINGLE_DOUBLE_OPTIONS.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        value={editingType.size}
                        onChange={(e) => setEditingType({ ...editingType, size: parseInt(e.target.value) || 0 })}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        value={editingType.vent_glazing}
                        onChange={(e) => setEditingType({ ...editingType, vent_glazing: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleUpdateType(editingType)}
                        className="text-green-600 hover:text-green-700 transition-colors"
                      >
                        <Save className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setEditingType(null)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-6 py-4 text-sm text-gray-900">{type.type}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{type.single_double}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{type.size}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{type.vent_glazing}</td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => setEditingType(type)}
                        className="text-gray-400 hover:text-green-600 transition-colors"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteType(type.id)}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
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
  );
}