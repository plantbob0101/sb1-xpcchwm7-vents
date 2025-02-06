import React from 'react';
import { ScreenConfigurations } from './ScreenConfigurations';
import { DriveConfigurations } from './DriveConfigurations';
import { supabase } from '../lib/supabase';

interface VentFormProps {
  projectId: string;
  existingConfiguration: any;
  onSubmit: (values: any) => void;
  onCancel: () => void;
  isLoading: boolean;
}

const CONFIGURATION_TYPES = [
  'Vent',
  'Roll Up Wall - Endwall',
  'Roll Up Wall - Sidewall',
  'Drop Wall'
] as const;

const WALL_TYPES = ['Guttered', 'Quonset'] as const;
const HOUSE_WIDTHS = [18, 21, 24, 27, 30, 35, 36, 42, 48, 50] as const;
const FRAME_HEIGHTS = [8, 10, 12, 14] as const;
const SPACINGS = [4, 6, 10, 12] as const;

export function VentForm({
  projectId,
  existingConfiguration,
  onSubmit,
  onCancel,
  isLoading
}: VentFormProps) {
  const [configurationType, setConfigurationType] = React.useState<typeof CONFIGURATION_TYPES[number]>(
    existingConfiguration?.configuration_type || 'Vent'
  );
  const [vents, setVents] = React.useState<any[]>([]);
  const [screens, setScreens] = React.useState<any[]>([]);
  const [drives, setDrives] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [screenConfigurations, setScreenConfigurations] = React.useState(
    existingConfiguration?.screen_configurations?.map((config: any) => ({
      id: config.id,
      screen_id: config.screen_id,
      screen_width: config.screen_width || '',
      screen_type: config.screen_type,
      calculated_quantity: config.calculated_quantity,
      slitting_fee: config.slitting_fee
    })) || []
  );
  const [driveConfigurations, setDriveConfigurations] = React.useState(
    existingConfiguration?.drive_configurations?.map((config: any) => ({
      id: config.id,
      drive_id: config.drive_id,
      quantity: config.quantity
    })) || []
  );
  const [error, setError] = React.useState<string | null>(null);

  // Form state
  const [values, setValues] = React.useState({
    // Common fields
    configuration_type: existingConfiguration?.configuration_type || 'Vent',
    // Vent specific fields
    vent_id: existingConfiguration?.vent_id || '',
    vent_quantity: existingConfiguration?.vent_quantity || 1,
    vent_length: existingConfiguration?.vent_length || '',
    ati_house: existingConfiguration?.ati_house ? 'Yes' : 'No',
    // Roll Up Wall - Endwall specific fields
    endwall_type: existingConfiguration?.endwall_type || 'Guttered',
    system_quantity: existingConfiguration?.system_quantity || 1,
    houses_wide_per_system: existingConfiguration?.houses_wide_per_system || 1,
    house_width: existingConfiguration?.house_width || HOUSE_WIDTHS[0],
    frame_height: existingConfiguration?.frame_height || FRAME_HEIGHTS[0],
    // Roll Up Wall - Sidewall specific fields
    sidewall_type: existingConfiguration?.sidewall_type || 'Guttered',
    eave_height: existingConfiguration?.eave_height || '',
    ns30: existingConfiguration?.ns30 || false,
    spacing: existingConfiguration?.spacing || SPACINGS[0],
    // Common optional fields
    gearbox_pocket: existingConfiguration?.gearbox_pocket || '',
    simu_winch: existingConfiguration?.simu_winch || '',
    ridder_mount_guttered: existingConfiguration?.ridder_mount_guttered || '',
    ridder_mount_quonset: existingConfiguration?.ridder_mount_quonset || '',
    notes: existingConfiguration?.notes || '',
    // Drop Wall specific fields
    braking_winch_with_mount: existingConfiguration?.braking_winch_with_mount || '',
    additional_corner_bracket: existingConfiguration?.additional_corner_bracket || '',
    // Freight requirements
    drives_freight: existingConfiguration?.vent_freight_requirements?.drives_freight || '',
    screen_freight: existingConfiguration?.vent_freight_requirements?.screen_freight || ''
  });

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch vents
        const { data: ventsData, error: ventsError } = await supabase
          .from('vents')
          .select('*')
          .order('type', { ascending: true });

        if (ventsError) throw ventsError;
        setVents(ventsData || []);

        // Fetch screens
        const { data: screensData, error: screensError } = await supabase
          .from('screens')
          .select('*')
          .order('product', { ascending: true });

        if (screensError) throw screensError;
        setScreens(screensData || []);

        // Fetch drives
        const { data: drivesData, error: drivesError } = await supabase
          .from('drives')
          .select('*')
          .order('drive_type', { ascending: true });

        if (drivesError) throw drivesError;
        setDrives(drivesData || []);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      ventConfiguration: {
        project_id: projectId,
        configuration_type: values.configuration_type,

        // Include fields based on configuration type
        ...(values.configuration_type === 'Vent' && {
          vent_id: values.vent_id,
          vent_quantity: values.vent_quantity,
          vent_length: values.vent_length,
          ati_house: values.ati_house === 'Yes'
        }),
        
        ...(values.configuration_type === 'Roll Up Wall - Endwall' && {
          endwall_type: values.endwall_type,
          system_quantity: values.system_quantity,
          houses_wide_per_system: values.houses_wide_per_system,
          house_width: values.house_width,
          frame_height: values.frame_height
        }),
        
        ...(values.configuration_type === 'Roll Up Wall - Sidewall' && {
          sidewall_type: values.sidewall_type,
          eave_height: values.eave_height,
          ns30: values.ns30,
          spacing: values.spacing
        }),
        
        ...(values.configuration_type === 'Drop Wall' && {
          braking_winch_with_mount: values.braking_winch_with_mount,
          additional_corner_bracket: values.additional_corner_bracket
        }),
        
        // Common fields
        gearbox_pocket: values.gearbox_pocket,
        simu_winch: values.simu_winch,
        ridder_mount_guttered: values.ridder_mount_guttered,
        ridder_mount_quonset: values.ridder_mount_quonset,
        notes: values.notes
      },
      
      screenConfigurations,
      driveConfigurations,
      
      freightRequirements: {
        drives_freight: values.drives_freight,
        screen_freight: values.screen_freight
      }
    };

    onSubmit(submitData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setValues(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-white rounded-lg shadow-lg p-6">
      <div className="grid grid-cols-1 gap-6">
        {/* Configuration Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Configuration Type
          </label>
          <select
            name="configuration_type"
            value={values.configuration_type}
            onChange={(e) => {
              setConfigurationType(e.target.value as typeof CONFIGURATION_TYPES[number]);
              handleChange(e);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {CONFIGURATION_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        {/* Render fields based on configuration type */}
        {configurationType === 'Vent' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vent Type
              </label>
              <select
                name="vent_id"
                value={values.vent_id}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Select Vent Type</option>
                {vents.map(vent => (
                  <option key={vent.id} value={vent.id}>
                    {vent.type} - {vent.single_double} - {vent.size}"
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity
              </label>
              <input
                type="number"
                name="vent_quantity"
                value={values.vent_quantity}
                onChange={handleChange}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Length
              </label>
              <input
                type="number"
                name="vent_length"
                value={values.vent_length}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ATI House
              </label>
              <select
                name="ati_house"
                value={values.ati_house}
                onChange={(e) => setValues(prev => ({ ...prev, ati_house: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>
          </div>
        )}

        {configurationType === 'Roll Up Wall - Endwall' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                name="endwall_type"
                value={values.endwall_type}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {WALL_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity of Systems
              </label>
              <input
                type="number"
                name="system_quantity"
                value={values.system_quantity}
                onChange={handleChange}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Houses Wide per System
              </label>
              <input
                type="number"
                name="houses_wide_per_system"
                value={values.houses_wide_per_system}
                onChange={handleChange}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                House Width
              </label>
              <select
                name="house_width"
                value={values.house_width}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {HOUSE_WIDTHS.map(width => (
                  <option key={width} value={width}>{width}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Frame Height
              </label>
              <select
                name="frame_height"
                value={values.frame_height}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {FRAME_HEIGHTS.map(height => (
                  <option key={height} value={height}>{height}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {configurationType === 'Roll Up Wall - Sidewall' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                name="sidewall_type"
                value={values.sidewall_type}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {WALL_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Eave Height
              </label>
              <input
                type="number"
                name="eave_height"
                value={values.eave_height}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="ns30"
                checked={values.ns30}
                onChange={(e) => setValues(prev => ({ ...prev, ns30: e.target.checked }))}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">
                NS30
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Spacing
              </label>
              <select
                name="spacing"
                value={values.spacing}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {SPACINGS.map(spacing => (
                  <option key={spacing} value={spacing}>{spacing}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {configurationType === 'Drop Wall' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                name="sidewall_type"
                value={values.sidewall_type}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {WALL_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Braking Winch with Mount
              </label>
              <input
                type="text"
                name="braking_winch_with_mount"
                value={values.braking_winch_with_mount}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Corner Bracket
              </label>
              <input
                type="text"
                name="additional_corner_bracket"
                value={values.additional_corner_bracket}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
        )}

        {/* Common Fields - Removed for Vent configuration type */}
        {values.configuration_type !== 'Vent' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gearbox Pocket
              </label>
              <input
                type="text"
                name="gearbox_pocket"
                value={values.gearbox_pocket}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Simu Winch
              </label>
              <input
                type="text"
                name="simu_winch"
                value={values.simu_winch}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ridder Mount Guttered
              </label>
              <input
                type="text"
                name="ridder_mount_guttered"
                value={values.ridder_mount_guttered}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ridder Mount Quonset
              </label>
              <input
                type="text"
                name="ridder_mount_quonset"
                value={values.ridder_mount_quonset}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
        )}

        {/* Screen Configurations */}
        <div className="border-t border-gray-200 pt-6">
          <ScreenConfigurations
            screens={screens}
            vents={vents}
            ventId={values.vent_id}
            configurations={screenConfigurations}
            ventSize={values.vent_id ? vents.find(v => v.id === values.vent_id)?.size : undefined}
            ventLength={parseFloat(values.vent_length) || undefined}
            ventQuantity={values.vent_quantity}
            houseWidth={values.house_width}
            eaveHeight={parseFloat(values.eave_height) || undefined}
            onChange={setScreenConfigurations}
          />
        </div>

        {/* Drive Configurations */}
        <div className="border-t border-gray-200 pt-6">
          <DriveConfigurations
            drives={drives}
            configurations={driveConfigurations}
            ventType={values.vent_id ? vents.find(v => v.id === values.vent_id)?.type : undefined}
            ventLength={parseFloat(values.vent_length) || undefined}
            onChange={setDriveConfigurations}
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            name="notes"
            value={values.notes}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* Freight Requirements */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Drives Freight
            </label>
            <input
              type="text"
              name="drives_freight"
              value={values.drives_freight}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Screen Freight
            </label>
            <input
              type="text"
              name="screen_freight"
              value={values.screen_freight}
              onChange={handleChange}
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