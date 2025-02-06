import React from 'react';
import { Plus, Pencil, Trash2, X, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface DoorType {
  id: string;
  type: string;
  size: string;
}

const DOOR_TYPES = ['Hinged', 'Inside Sliding', 'Outside Sliding', 'Door Jamb Kit'] as const;

export function DoorTypeManager() {
  const [doorTypes, setDoorTypes] = React.useState<DoorType[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [editingType, setEditingType] = React.useState<DoorType | null>(null);
  const [newType, setNewType] = React.useState({
    type: DOOR_TYPES[0],
    size: ''
  });

  const fetchDoorTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('door_types')
        .select('*')
        .order('type', { ascending: true });

      if (error) throw error;
      setDoorTypes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchDoorTypes();
  }, []);

  const handleAddType = async () => {
    try {
      if (!newType.size.trim()) {
        setError('Size is required');
        return;
      }

      const { data, error } = await supabase
        .from('door_types')
        .insert({
          type: newType.type,
          size: newType.size
        })
        .select()
        .single();

      if (error) throw error;

      setDoorTypes(prev => [...prev, data]);
      setNewType({
        type: DOOR_TYPES[0],
        size: ''
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleUpdateType = async (type: DoorType) => {
    try {
      const { error } = await supabase
        .from('door_types')
        .update({
          type: type.type,
          size: type.size
        })
        .eq('id', type.id);

      if (error) throw error;

      setDoorTypes(prev => prev.map(t => t.id === type.id ? type : t));
      setEditingType(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleDeleteType = async (id: string) => {
    if (!confirm('Are you sure you want to delete this door type?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('door_types')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setDoorTypes(prev => prev.filter(t => t.id !== id));
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
        <h2 className="text-2xl font-bold text-gray-900">Door Types</h2>
        <div className="flex items-center space-x-4">
          <select
            value={newType.type}
            onChange={(e) => setNewType(prev => ({ ...prev, type: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {DOOR_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <input
            type="text"
            value={newType.size}
            onChange={(e) => setNewType(prev => ({ ...prev, size: e.target.value }))}
            placeholder="Enter size (e.g., 3' x 7')"
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
                Size
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {doorTypes.map(type => (
              <tr key={type.id}>
                {editingType?.id === type.id ? (
                  <>
                    <td className="px-6 py-4">
                      <select
                        value={editingType.type}
                        onChange={(e) => setEditingType({ ...editingType, type: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        {DOOR_TYPES.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        value={editingType.size}
                        onChange={(e) => setEditingType({ ...editingType, size: e.target.value })}
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
                    <td className="px-6 py-4 text-sm text-gray-900">{type.size}</td>
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