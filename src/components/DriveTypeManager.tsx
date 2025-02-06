import React from 'react';
import { Plus, Pencil, Trash2, X, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Drive {
  id: string;
  drive_type: string;
  motor: string;
  size: number;
  greenhouse_type: string;
}

const DRIVE_TYPES = [
  'Curtain 1212',
  'Curtain CT/North Slope',
  'Curtain Insulator',
  'Curtain Solar Light',
  'Drop Wall',
  'Manual Gearbox',
  'Pad Vent',
  'RollUp Wall',
  'Roof Vents',
  'Wall Vents'
] as const;

const GREENHOUSE_TYPES = ['All', 'Gothic', 'Solar Light'] as const;

export function DriveTypeManager() {
  const [drives, setDrives] = React.useState<Drive[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [editingDrive, setEditingDrive] = React.useState<Drive | null>(null);
  const [newDrive, setNewDrive] = React.useState({
    drive_type: DRIVE_TYPES[0],
    motor: '',
    size: 0,
    greenhouse_type: GREENHOUSE_TYPES[0]
  });

  const fetchDrives = async () => {
    try {
      const { data, error } = await supabase
        .from('drives')
        .select('*')
        .order('drive_type', { ascending: true });

      if (error) throw error;
      setDrives(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchDrives();
  }, []);

  const handleAddDrive = async () => {
    try {
      if (!newDrive.motor || !newDrive.size) {
        setError('Motor and size are required');
        return;
      }

      const { data, error } = await supabase
        .from('drives')
        .insert({
          drive_type: newDrive.drive_type,
          motor: newDrive.motor,
          size: newDrive.size,
          greenhouse_type: newDrive.greenhouse_type
        })
        .select()
        .single();

      if (error) throw error;

      setDrives(prev => [...prev, data]);
      setNewDrive({
        drive_type: DRIVE_TYPES[0],
        motor: '',
        size: 0,
        greenhouse_type: GREENHOUSE_TYPES[0]
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleUpdateDrive = async (drive: Drive) => {
    try {
      const { error } = await supabase
        .from('drives')
        .update({
          drive_type: drive.drive_type,
          motor: drive.motor,
          size: drive.size,
          greenhouse_type: drive.greenhouse_type
        })
        .eq('id', drive.id);

      if (error) throw error;

      setDrives(prev => prev.map(d => d.id === drive.id ? drive : d));
      setEditingDrive(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleDeleteDrive = async (id: string) => {
    if (!confirm('Are you sure you want to delete this drive?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('drives')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setDrives(prev => prev.filter(d => d.id !== id));
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
        <h2 className="text-2xl font-bold text-gray-900">Drive Types</h2>
        <div className="flex items-center space-x-4">
          <select
            value={newDrive.drive_type}
            onChange={(e) => setNewDrive(prev => ({ ...prev, drive_type: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {DRIVE_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <input
            type="text"
            value={newDrive.motor}
            onChange={(e) => setNewDrive(prev => ({ ...prev, motor: e.target.value }))}
            placeholder="Motor"
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <input
            type="number"
            value={newDrive.size || ''}
            onChange={(e) => setNewDrive(prev => ({ ...prev, size: parseInt(e.target.value) || 0 }))}
            placeholder="Size (ft)"
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <select
            value={newDrive.greenhouse_type}
            onChange={(e) => setNewDrive(prev => ({ ...prev, greenhouse_type: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {GREENHOUSE_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <button
            onClick={handleAddDrive}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Drive
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
                Drive Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Motor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Size (ft)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Greenhouse Type
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {drives.map(drive => (
              <tr key={drive.id}>
                {editingDrive?.id === drive.id ? (
                  <>
                    <td className="px-6 py-4">
                      <select
                        value={editingDrive.drive_type}
                        onChange={(e) => setEditingDrive({ ...editingDrive, drive_type: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        {DRIVE_TYPES.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        value={editingDrive.motor}
                        onChange={(e) => setEditingDrive({ ...editingDrive, motor: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        value={editingDrive.size}
                        onChange={(e) => setEditingDrive({ ...editingDrive, size: parseInt(e.target.value) || 0 })}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={editingDrive.greenhouse_type}
                        onChange={(e) => setEditingDrive({ ...editingDrive, greenhouse_type: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        {GREENHOUSE_TYPES.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleUpdateDrive(editingDrive)}
                        className="text-green-600 hover:text-green-700 transition-colors"
                      >
                        <Save className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setEditingDrive(null)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-6 py-4 text-sm text-gray-900">{drive.drive_type}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{drive.motor}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{drive.size}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{drive.greenhouse_type}</td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => setEditingDrive(drive)}
                        className="text-gray-400 hover:text-green-600 transition-colors"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteDrive(drive.id)}
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