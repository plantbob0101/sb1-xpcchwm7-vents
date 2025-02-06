import React from 'react';
import { Building2, Plus, X, Settings } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Subcategory, Option, StructureDescription, StructureModel } from '../types/greenhouse';
import { UnitCalculator } from './UnitCalculator';
import { ModelManager } from './ModelManager';
import { StructureModelForm } from './StructureModelForm';

interface StructureOptionsProps {
  projectId: string;
  onSelect: (subcategoryId: string, optionId: string) => void;
  selections: Record<string, string>;
}

export function StructureOptions({ projectId, onSelect, selections }: StructureOptionsProps) {
  const [subcategories, setSubcategories] = React.useState<Subcategory[]>([]);
  const [options, setOptions] = React.useState<Option[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showModelManager, setShowModelManager] = React.useState(false);
  const [description, setDescription] = React.useState<StructureDescription | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [showForm, setShowForm] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [modelName, setModelName] = React.useState('');
  const [modelDescription, setModelDescription] = React.useState('');
  const [savedStructure, setSavedStructure] = React.useState<StructureModel | null>(null);
  const [showSuccess, setShowSuccess] = React.useState(false);
  const [selectedModel, setSelectedModel] = React.useState<any>(null);
  const [newStructureData, setNewStructureData] = React.useState({
    name: '',
    description: ''
  });

  React.useEffect(() => {
    const fetchModelDetails = async () => {
      if (savedStructure?.model_id) {
        const { data, error } = await supabase
          .from('greenhouse_models')
          .select('*')
          .eq('id', savedStructure.model_id)
          .single();

        if (!error && data) {
          setSelectedModel(data);
        }
      }
    };

    fetchModelDetails();
  }, [savedStructure]);

  React.useEffect(() => {
    const fetchStructureOptions = async () => {
      try {
        // Get existing structure description and model
        const { data: descriptions, error: descError } = await supabase
          .from('structure_descriptions')
          .select('*')
          .eq('project_id', projectId);

        if (!descError && descriptions && descriptions.length > 0) {
          setDescription(descriptions[0]);
          setModelName(descriptions[0].name);
          setModelDescription(descriptions[0].description || '');
          
          // Fetch the associated structure model without using .single()
          const { data: structure, error: structureError } = await supabase
            .from('structure_models')
            .select(`
              *,
              greenhouse_models (
                name,
                gutter_connect
              )
            `)
            .eq('description_id', descriptions[0].id)
            .order('created_at', { ascending: false })
            .limit(1);

          if (structureError) {
            console.warn('Error fetching structure model:', structureError.message);
          } else if (structure && structure.length > 0) {
            setSavedStructure(structure[0]);
          } else {
            console.log('No structure model found for this description');
          }
        }

        // First, get the structure category ID
        const { data: categoryData, error: categoryError } = await supabase
          .from('categories')
          .select('id')
          .eq('name', 'Structure')
          .single();

        if (categoryError) throw categoryError;

        // Then get subcategories for structure
        const { data: subcategoriesData, error: subcategoriesError } = await supabase
          .from('subcategories')
          .select('*')
          .eq('category_id', categoryData.id)
          .order('display_order');

        if (subcategoriesError) throw subcategoriesError;

        setSubcategories(subcategoriesData);

        // Finally, get all options for these subcategories
        if (subcategoriesData.length > 0) {
          const { data: optionsData, error: optionsError } = await supabase
            .from('options')
            .select('*')
            .in('subcategory_id', subcategoriesData.map(s => s.id));

          if (optionsError) throw optionsError;

          setOptions(optionsData);
        }

        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setLoading(false);
      }
    };

    fetchStructureOptions();
  }, [projectId]);

  const handleSaveModel = async (values: {
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
    base_angel_12ft?: number;
    ba_bolts?: number;
    base_stringer?: number;
  }) => {
    setSaving(true);
    setError(null);

    try {
      // Validate required fields
      if (!modelName?.trim()) {
        setError('Structure name is required');
        setSaving(false);
        return;
      }

      if (!values.model_id) {
        setError('Please select a greenhouse model');
        setSaving(false);
        return;
      }

      const descriptionData = {
        project_id: projectId,
        name: modelName,
        description: modelDescription || null,
        updated_at: new Date().toISOString()
      };

      // First, handle the structure description
      let descriptionId;
      if (description) {
        const { error: updateError } = await supabase
          .from('structure_descriptions')
          .update({
            name: modelName,
            description: modelDescription || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', description.id);

        if (updateError) {
          console.error('Error updating structure description:', updateError);
          throw new Error(`Failed to update structure description: ${updateError.message}`);
        }
        
        descriptionId = description.id;
      } else {
        const { data: newDesc, error: createError } = await supabase
          .from('structure_descriptions')
          .insert({
            project_id: projectId,
            name: modelName,
            description: modelDescription || null,
            updated_at: new Date().toISOString()
          })
          .single();

        if (createError) {
          console.error('Error creating structure description:', createError);
          throw new Error(`Failed to create structure description: ${createError.message}`);
        }

        // Handle case where no data is returned
        if (!newDesc?.id) {
          const { data: createdDesc, error: fetchError } = await supabase
            .from('structure_descriptions')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false })
            .single();

          if (fetchError || !createdDesc) {
            throw new Error('Failed to retrieve created structure description');
          }

          descriptionId = createdDesc.id;
          setDescription(createdDesc);
        } else {
          descriptionId = newDesc.id;
          setDescription(newDesc);
        }
      }

      // Prepare structure model data
      const structureData = {
          project_id: projectId || null,
          model_id: values.model_id,
          width: values.width,
          load: values.load,
          glazing: values.glazing,
          eave: values.eave,
          range_count: values.range,
          house_count: values.house,
          house_length: values.houseLength,
          description_id: descriptionId || null,
          structural_upgrades: values.structural_upgrades,
          zones: values.zones,
          concrete_slab: values.concrete_slab,
          phase_voltage: values.phase_voltage,
          nat_gas_propane: values.nat_gas_propane,
          elevation: values.elevation,
          temps_climate: values.temps_climate,
          roof: values.roof,
          roof_vent: values.roof_vent,
          sidewalls: values.sidewalls,
          endwalls: values.endwalls,
          upper_gables: values.upper_gables,
          gutter_partitions: values.gutter_partitions,
          gable_partitions: values.gable_partitions,
          stemwall: values.stemwall,
          endwall_transitions: values.endwall_transitions,
          base_angle_12ft: values.base_angel_12ft,
          ba_bolts: values.ba_bolts,
          base_stringer: values.base_stringer
      };

      // Save or update the structure model
      const { data: modelData, error: modelError } = savedStructure
        ? await supabase
            .from('structure_models')
            .update(structureData)
            .eq('id', savedStructure.id)
            .select()
            .single()
        : await supabase
            .from('structure_models')
            .insert(structureData)
            .select()
            .single();

      if (modelError) throw modelError;
      if (!modelData) throw new Error('Failed to save structure model');
      
      // Get the complete structure with greenhouse model info
      const { data: completeStructure, error: fetchError } = await supabase
        .from('structure_models')
        .select(`
          *,
          greenhouse_models (
            name,
            gutter_connect
          )
        `)
        .eq('id', modelData.id)
        .single();

      if (fetchError) throw fetchError;
      if (completeStructure) {
        setSavedStructure(completeStructure);
      }

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);

      setShowForm(false);
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'An error occurred while saving the structure. Please try again.';
      console.error('Structure save error:', err);
      setError(errorMessage);
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

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-md">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Building2 className="h-6 w-6 text-green-600" />
          <h2 className="text-2xl font-bold text-gray-900">Structure Configuration</h2>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowModelManager(!showModelManager)}
            className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            title="Model Management"
          >
            <Settings className="h-5 w-5" />
          </button>
          <button
            onClick={() => {
              setNewStructureData({
                name: '',
                description: ''
              });
              setModelName(`Structure ${new Date().toLocaleDateString()}`);
              setModelDescription('');
              setShowForm(true);
            }}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Structure
          </button>
        </div>
      </div>

      {showModelManager && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">
              Model Management
            </h3>
            <button
              onClick={() => setShowModelManager(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <ModelManager />
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">
              {savedStructure ? 'Edit Structure' : 'Add New Structure'}
            </h3>
            <div className="flex-1 mx-8">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Structure Name*
                    {!modelName && <span className="text-red-500 ml-1">Required</span>}
                  </label>
                  <input
                    type="text"
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      !modelName ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter structure name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={modelDescription}
                    onChange={(e) => setModelDescription(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Enter structure description (optional)"
                  />
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <StructureModelForm 
            onSubmit={handleSaveModel} 
            existingStructure={savedStructure}
            isLoading={saving} 
          />
        </div>
      )}
      
      {showSuccess && (
        <div className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded z-50 flex items-center">
          <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Structure saved successfully
        </div>
      )}
      
      {!showForm && !showModelManager && !savedStructure && (
        <div className="text-center py-12 bg-white rounded-lg shadow-lg">
          <Building2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            No Structure Configuration
          </h3>
          <p className="text-gray-500 mb-6">
            Click "Add Structure" to start configuring your greenhouse structure.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Structure
          </button>
        </div>
      )}
      
      {!showForm && !showModelManager && savedStructure && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">
                  {modelName}
                </h3>
                {savedStructure?.greenhouse_models?.name && (
                  <h4 className="text-lg text-green-600 font-medium mb-2">
                    {savedStructure.greenhouse_models.name}
                  </h4>
                )}
                {modelDescription && (
                  <p className="text-gray-600">{modelDescription}</p>
                )}
              </div>
              <button
                onClick={() => setShowForm(true)}
                className="text-gray-400 hover:text-green-600"
                title="Edit Structure"
              >
                <Settings className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex flex-col sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-500">Width</div>
                <div className="text-lg font-medium">{savedStructure.width} ft</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-500">Snow/Wind Load</div>
                <div className="text-lg font-medium">{savedStructure.load}</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-500">Spacing</div>
                <div className="text-lg font-medium">{savedStructure.spacing}</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-500">Glazing</div>
                <div className="text-lg font-medium">{savedStructure.glazing}</div>
              </div>
            </div>
            
            <div className="flex flex-col sm:grid sm:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-500">Ranges</div>
                <div className="text-lg font-medium">{savedStructure.range_count}</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-500">Houses</div>
                <div className="text-lg font-medium">{savedStructure.house_count}</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-500">House Length</div>
                <div className="text-lg font-medium">{savedStructure.house_length} ft</div>
              </div>
            </div>

            {/* Additional Specifications Display */}
            <div className="mt-8">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Additional Specifications</h4>
              <div className="flex flex-col sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedStructure.structural_upgrades && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500">Structural Upgrades</div>
                    <div className="text-lg font-medium">{savedStructure.structural_upgrades}</div>
                  </div>
                )}
                {savedStructure.zones && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500">Zones</div>
                    <div className="text-lg font-medium">{savedStructure.zones}</div>
                  </div>
                )}
                {savedStructure.concrete_slab && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500">Concrete Slab</div>
                    <div className="text-lg font-medium">{savedStructure.concrete_slab}</div>
                  </div>
                )}
                {savedStructure.phase_voltage && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500">Phase/Voltage</div>
                    <div className="text-lg font-medium">{savedStructure.phase_voltage}</div>
                  </div>
                )}
                {savedStructure.nat_gas_propane && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500">Nat Gas/Propane</div>
                    <div className="text-lg font-medium">{savedStructure.nat_gas_propane}</div>
                  </div>
                )}
                {savedStructure.elevation !== null && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500">Elevation</div>
                    <div className="text-lg font-medium">{savedStructure.elevation}</div>
                  </div>
                )}
                {savedStructure.temps_climate && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500">Temps/Climate</div>
                    <div className="text-lg font-medium">{savedStructure.temps_climate}</div>
                  </div>
                )}
                {savedStructure.roof && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500">Roof</div>
                    <div className="text-lg font-medium">{savedStructure.roof}</div>
                  </div>
                )}
                {savedStructure.roof_vent && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500">Roof Vent</div>
                    <div className="text-lg font-medium">{savedStructure.roof_vent}</div>
                  </div>
                )}
                {savedStructure.sidewalls && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500">Sidewalls</div>
                    <div className="text-lg font-medium">{savedStructure.sidewalls}</div>
                  </div>
                )}
                {savedStructure.endwalls && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500">Endwalls</div>
                    <div className="text-lg font-medium">{savedStructure.endwalls}</div>
                  </div>
                )}
                {savedStructure.upper_gables && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500">Upper Gables</div>
                    <div className="text-lg font-medium">{savedStructure.upper_gables}</div>
                  </div>
                )}
                {savedStructure.gutter_partitions !== null && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500">Gutter Partitions</div>
                    <div className="text-lg font-medium">{savedStructure.gutter_partitions}</div>
                  </div>
                )}
                {savedStructure.gable_partitions !== null && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500">Gable Partitions</div>
                    <div className="text-lg font-medium">{savedStructure.gable_partitions}</div>
                  </div>
                )}
                {savedStructure.stemwall && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500">Stemwall</div>
                    <div className="text-lg font-medium">{savedStructure.stemwall}</div>
                  </div>
                )}
                {savedStructure.endwall_transitions !== null && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500">Endwall Transitions</div>
                    <div className="text-lg font-medium">{savedStructure.endwall_transitions}</div>
                  </div>
                )}
                {savedStructure.base_angle_12ft !== null && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500">Base Angle 12ft</div>
                    <div className="text-lg font-medium">{savedStructure.base_angle_12ft}</div>
                  </div>
                )}
                {savedStructure.ba_bolts !== null && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500">BA Bolts</div>
                    <div className="text-lg font-medium">{savedStructure.ba_bolts}</div>
                  </div>
                )}
                {savedStructure.base_stringer !== null && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500">Base Stringer</div>
                    <div className="text-lg font-medium">{savedStructure.base_stringer}</div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between items-start">
              <h3 className="text-lg font-semibold text-gray-900">Unit Breakdown</h3>
            </div>
            
            {savedStructure && (
              <div className="mt-6">
                <UnitCalculator
                  ranges={savedStructure.range_count}
                  houses={savedStructure.house_count}
                  houseLength={savedStructure.house_length}
                  width={savedStructure.width}
                  gutterConnect={selectedModel?.gutter_connect}
                  concreteSlab={savedStructure.concrete_slab}
                  gutterPartitions={savedStructure.gutter_partitions}
                  gablePartitions={savedStructure.gable_partitions}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}