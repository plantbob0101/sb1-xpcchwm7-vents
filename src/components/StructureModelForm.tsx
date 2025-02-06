import React from 'react';
import { supabase } from '../lib/supabase';
import type { StructureModel } from '../types/greenhouse';

interface StructureModelFormProps {
  existingStructure: StructureModel | null;
  onSubmit: (values: {
    model_id: string;
    width: string;
    load: string;
    glazing: string;
    eave: string;
    range: number;
    house: number;
    houseLength: number;
    structural_upgrades?: string;
    zones?: number;
    concrete_slab?: string;
    phase_voltage?: string;
    nat_gas_propane?: string;
    elevation?: number;
    temps_climate?: string;
    roof?: string;
    roof_vent?: string;
    sidewalls?: string;
    endwalls?: string;
    upper_gables?: string;
    gutter_partitions?: number;
    gable_partitions?: number;
    stemwall?: string;
    endwall_transitions?: number;
    spacing?: string;
  }) => void;
  isLoading: boolean;
}

export function StructureModelForm({ existingStructure, onSubmit, isLoading }: StructureModelFormProps) {
  const [models, setModels] = React.useState<Array<{ id: string; name: string }>>([]);
  const [configurations, setConfigurations] = React.useState<Array<{
    id: string;
    width: number;
    load: number;
    glazing: string;
    eave: number;
    spacing?: string;
  }>>([]);
  const [values, setValues] = React.useState({
    model_id: '',
    width: '',
    load: '',
    glazing: '',
    eave: '',
    range: 1,
    house: 1,
    houseLength: 100,
    structural_upgrades: '',
    zones: undefined,
    concrete_slab: '',
    phase_voltage: '',
    nat_gas_propane: '',
    elevation: undefined,
    temps_climate: '',
    roof: '',
    roof_vent: '',
    sidewalls: '',
    endwalls: '',
    upper_gables: '',
    gutter_partitions: undefined,
    gable_partitions: undefined,
    stemwall: '',
    endwall_transitions: undefined,
    spacing: ''
  });

  React.useEffect(() => {
    const fetchModels = async () => {
      const { data: modelsData, error: modelsError } = await supabase
        .from('greenhouse_models')
        .select('*')
        .order('name');

      if (!modelsError && modelsData) {
        setModels(modelsData);
      }
    };

    fetchModels();
  }, []);

  React.useEffect(() => {
    if (values.model_id) {
      const fetchConfigurations = async () => {
        // Fetch configurations for the selected model
        const { data: configsData, error: configsError } = await supabase
          .from('model_configurations')
          .select('*')
          .eq('model_id', values.model_id)
          .order('width', { ascending: true });

        if (!configsError && configsData) {
          setConfigurations(configsData);
          
          // Only reset values if this is not an existing structure being edited
          if (!existingStructure) {
            setValues(prev => ({
              ...prev,
              width: '',
              load: '',
              eave: '',
              glazing: '',
              spacing: ''
            }));
          }
        }
      };

      fetchConfigurations();
    }
  }, [values.model_id, existingStructure]);

  React.useEffect(() => {
    if (existingStructure) {
      setValues({
        model_id: existingStructure.model_id || '',
        width: existingStructure.width,
        load: existingStructure.load,
        glazing: existingStructure.glazing,
        eave: existingStructure.eave,
        range: existingStructure.range_count || 1,
        house: existingStructure.house_count || 1,
        houseLength: existingStructure.house_length || 100,
        structural_upgrades: existingStructure.structural_upgrades?.toString() || '',
        zones: existingStructure.zones,
        concrete_slab: existingStructure.concrete_slab?.toString() || '',
        phase_voltage: existingStructure.phase_voltage?.toString() || '',
        nat_gas_propane: existingStructure.nat_gas_propane?.toString() || '',
        elevation: existingStructure.elevation,
        temps_climate: existingStructure.temps_climate?.toString() || '',
        roof: existingStructure.roof?.toString() || '',
        roof_vent: existingStructure.roof_vent?.toString() || '',
        sidewalls: existingStructure.sidewalls?.toString() || '',
        endwalls: existingStructure.endwalls?.toString() || '',
        upper_gables: existingStructure.upper_gables?.toString() || '',
        gutter_partitions: existingStructure.gutter_partitions,
        gable_partitions: existingStructure.gable_partitions,
        stemwall: existingStructure.stemwall?.toString() || '',
        endwall_transitions: existingStructure.endwall_transitions,
        spacing: existingStructure.spacing?.toString() || ''
      });
    }
  }, [existingStructure]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let parsedValue = value;
    
    // Convert numeric fields to numbers
    if (['range', 'house', 'houseLength', 'zones', 'elevation', 'gutter_partitions', 'gable_partitions', 'endwall_transitions'].includes(name)) {
      parsedValue = value === '' ? undefined : Number(value);
    }

    setValues(prev => ({
      ...prev,
      [name]: parsedValue
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      model_id: values.model_id,
      width: values.width,
      load: values.load,
      glazing: values.glazing,
      eave: values.eave,
      range: parseInt(values.range) || 1,
      house: parseInt(values.house) || 1,
      houseLength: parseInt(values.houseLength) || 100,
      structural_upgrades: values.structural_upgrades,
      zones: values.zones ? parseInt(values.zones) : undefined,
      concrete_slab: values.concrete_slab,
      phase_voltage: values.phase_voltage,
      nat_gas_propane: values.nat_gas_propane,
      elevation: values.elevation ? parseFloat(values.elevation) : undefined,
      temps_climate: values.temps_climate,
      roof: values.roof,
      roof_vent: values.roof_vent,
      sidewalls: values.sidewalls,
      endwalls: values.endwalls,
      upper_gables: values.upper_gables,
      gutter_partitions: values.gutter_partitions ? parseInt(values.gutter_partitions) : undefined,
      gable_partitions: values.gable_partitions ? parseInt(values.gable_partitions) : undefined,
      stemwall: values.stemwall,
      endwall_transitions: values.endwall_transitions ? parseFloat(values.endwall_transitions) : undefined,
      spacing: values.spacing
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Configuration */}
        <div className="md:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Model
              </label>
              <select
                name="model_id"
                value={values.model_id}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              >
                <option value="">Select a model</option>
                {models.map(model => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Width (ft)
              </label>
              <select
                name="width"
                value={values.width}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              >
                <option value="">Select width (ft)</option>
                {Array.from(new Set(configurations.map(c => c.width))).map(width => (
                  <option key={width} value={String(width)}>
                    {width} ft
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Snow/Wind Load
              </label>
              <select
                name="load"
                value={values.load}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              >
                <option value="">Select snow/wind load</option>
                {Array.from(new Set(configurations.map(c => c.load))).map(load => (
                  <option key={load} value={String(load)}>
                    {load}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Eave Height (ft)
              </label>
              <select
                name="eave"
                value={values.eave}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              >
                <option value="">Select eave height (ft)</option>
                {Array.from(new Set(configurations.map(c => c.eave))).map(eave => (
                  <option key={eave} value={String(eave)}>
                    {eave} ft
                  </option>
                ))}
              </select>
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
                required
              >
                <option value="">Select spacing</option>
                {Array.from(new Set(configurations.map(c => c.spacing))).map(spacing => (
                  <option key={spacing} value={spacing}>
                    {spacing}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Glazing
              </label>
              <select
                name="glazing"
                value={values.glazing}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              >
                <option value="">Select glazing type</option>
                {Array.from(new Set(configurations.map(c => c.glazing))).map(glazing => (
                  <option key={glazing} value={glazing}>
                    {glazing}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ranges
              </label>
              <input
                type="number"
                name="range"
                value={values.range || ''}
                onChange={handleChange}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Houses
              </label>
              <input
                type="number"
                name="house"
                value={values.house || ''}
                onChange={handleChange}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                House Length (ft)
              </label>
              <input
                type="number"
                name="houseLength"
                value={values.houseLength || ''}
                onChange={handleChange}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
          </div>
        </div>

        {/* Additional Specifications */}
        <div className="md:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Specifications</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Structural Upgrades
              </label>
              <input
                type="text"
                name="structural_upgrades"
                value={values.structural_upgrades}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter structural upgrades"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Zones
              </label>
              <input
                type="number"
                name="zones"
                value={values.zones || ''}
                onChange={handleChange}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Concrete Slab
              </label>
              <select
                name="concrete_slab"
                value={values.concrete_slab}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Select option</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phase/Voltage
              </label>
              <input
                type="text"
                name="phase_voltage"
                value={values.phase_voltage}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter phase/voltage specification"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nat Gas/Propane
              </label>
              <input
                type="text"
                name="nat_gas_propane"
                value={values.nat_gas_propane}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter gas type specification"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Elevation (ft)
              </label>
              <input
                type="number"
                name="elevation"
                value={values.elevation || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Temps/Climate
              </label>
              <input
                type="text"
                name="temps_climate"
                value={values.temps_climate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter temperature and climate details"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Roof
              </label>
              <select
                name="roof"
                value={values.roof}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Select option</option>
                <option value="PC8">PC8</option>
                <option value="PC80%">PC80%</option>
                <option value="CPC">CPC</option>
                <option value="MS">MS</option>
                <option value="Poly">Poly</option>
                <option value="Double Poly">Double Poly</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Roof Vent
              </label>
              <select
                name="roof_vent"
                value={values.roof_vent}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Select option</option>
                <option value="None">None</option>
                <option value="PC8">PC8</option>
                <option value="PC80%">PC80%</option>
                <option value="CPC">CPC</option>
                <option value="MS">MS</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sidewalls
              </label>
              <select
                name="sidewalls"
                value={values.sidewalls}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Select option</option>
                <option value="PC8">PC8</option>
                <option value="PC80%">PC80%</option>
                <option value="CPC">CPC</option>
                <option value="MS">MS</option>
                <option value="Single Poly">Single Poly</option>
                <option value="Double Poly">Double Poly</option>
                <option value="Roll Up Wall">Roll Up Wall</option>
                <option value="Drop Wall">Drop Wall</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Endwalls
              </label>
              <select
                name="endwalls"
                value={values.endwalls}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Select option</option>
                <option value="PC8">PC8</option>
                <option value="PC80%">PC80%</option>
                <option value="CPC">CPC</option>
                <option value="MS">MS</option>
                <option value="Single Poly">Single Poly</option>
                <option value="Double Poly">Double Poly</option>
                <option value="Roll Up Wall">Roll Up Wall</option>
                <option value="Drop Wall">Drop Wall</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Upper Gables
              </label>
              <select
                name="upper_gables"
                value={values.upper_gables}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Select option</option>
                <option value="PC8">PC8</option>
                <option value="PC80%">PC80%</option>
                <option value="CPC">CPC</option>
                <option value="MS">MS</option>
                <option value="Poly">Poly</option>
                <option value="Double Poly">Double Poly</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gutter Partitions
              </label>
              <input
                type="number"
                name="gutter_partitions"
                value={values.gutter_partitions || ''}
                onChange={handleChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gable Partitions
              </label>
              <input
                type="number"
                name="gable_partitions"
                value={values.gable_partitions || ''}
                onChange={handleChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stemwall
              </label>
              <input
                type="text"
                name="stemwall"
                value={values.stemwall}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter stemwall specification"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Endwall Transitions
              </label>
              <input
                type="number"
                name="endwall_transitions"
                value={values.endwall_transitions || ''}
                onChange={handleChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
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