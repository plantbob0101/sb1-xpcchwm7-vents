import React, { useState } from 'react';
import { X, Search, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ShareProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

export function ShareProjectModal({ isOpen, onClose, projectId }: ShareProjectModalProps) {
  const [email, setEmail] = useState('');
  const [permissions, setPermissions] = useState<'view' | 'edit'>('view');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [shares, setShares] = useState<Array<{
    id: string;
    shared_with_email: string;
    permissions: 'view' | 'edit';
  }>>([]);

  React.useEffect(() => {
    if (isOpen) {
      fetchShares();
    }
  }, [isOpen, projectId]);

  const fetchShares = async () => {
    try {
      const { data: sharesData, error: sharesError } = await supabase
        .from('project_shares')
        .select(`
          id, 
          permissions,
          profiles!project_shares_shared_with_id_fkey (
            email
          )
        `)
        .eq('project_id', projectId);

      if (sharesError) throw sharesError;

      setShares(sharesData?.map(share => ({
        id: share.id,
        shared_with_email: share.profiles?.email || '',
        permissions: share.permissions
      })) || []);
    } catch (err) {
      console.error('Error fetching shares:', err);
    }
  };

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Look up the user's profile by email
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .ilike('email', email.trim().toLowerCase())
        .single();

      if (userError) {
        throw new Error('User not found');
      }

      // Get current user
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        throw new Error('Not authenticated');
      }

      // Check if trying to share with self
      if (userData.id === currentUser.id) {
        throw new Error('Cannot share project with yourself');
      }

      // Check if share already exists
      const { data: existingShares, error: existingShareError } = await supabase
        .from('project_shares')
        .select('*')
        .eq('project_id', projectId)
        .eq('shared_with_id', userData.id);

      if (existingShareError) {
        throw existingShareError;
      }

      if (existingShares && existingShares.length > 0) {
        throw new Error('This project is already shared with this user');
      }

      // Then create the share
      const { error: shareError } = await supabase
        .from('project_shares')
        .upsert({
          project_id: projectId,
          shared_with_id: userData.id,
          permissions,
          created_by: currentUser.id
        }, {
          onConflict: 'project_id,shared_with_id',
          ignoreDuplicates: false
        });

      if (shareError) {
        throw shareError;
      }

      setSuccess(true);
      setEmail('');
      fetchShares();
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes('not found')) {
          setError('No user found with this email address');
        } else if (err.message.includes('already shared')) {
          setError('This project is already shared with this user');
        } else {
          setError(err.message);
        }
      } else {
        setError('An error occurred while sharing the project');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setError(null); // Clear any previous errors when email changes
    setSuccess(false); // Reset success state
  };

  const handleRemoveShare = async (shareId: string) => {
    try {
      const { error } = await supabase
        .from('project_shares')
        .delete()
        .eq('id', shareId);

      if (error) throw error;
      
      await fetchShares();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="h-6 w-6" />
        </button>
        
        <h2 className="text-2xl font-bold mb-6">Share Project</h2>
        
        <form onSubmit={handleShare} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={handleEmailChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Enter email address"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Permissions
            </label>
            <select
              value={permissions}
              onChange={(e) => setPermissions(e.target.value as 'view' | 'edit')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="view">View only</option>
              <option value="edit">Can edit</option>
            </select>
          </div>

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          {success && (
            <div className="text-green-600 text-sm">Project shared successfully!</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                Sharing...
              </>
            ) : (
              'Share Project'
            )}
          </button>
        </form>

        {shares.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Shared With
            </h3>
            <div className="space-y-3">
              {shares.map(share => (
                <div
                  key={share.id}
                  className="flex items-center justify-between bg-gray-50 p-3 rounded-md"
                >
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {share.shared_with_email}
                    </div>
                    <div className="text-xs text-gray-500">
                      {share.permissions === 'edit' ? 'Can edit' : 'View only'}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveShare(share.id)}
                    className="text-gray-400 hover:text-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}