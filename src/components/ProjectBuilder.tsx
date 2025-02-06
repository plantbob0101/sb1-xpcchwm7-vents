import React, { useEffect, useState } from 'react';
import { ArrowLeft, Building, DoorOpen as Door, Wind, PanelTop, Thermometer, Fan, Mountain as Curtain, Table, Settings, PlusCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Category, Project, Subcategory, Option, UserSelection } from '../types/greenhouse';
import { CategoryList } from './CategoryList';
import { DoorsAndVestibules } from './DoorsAndVestibules';
import { StructureOptions } from './StructureOptions';
import { Vents } from './Vents';

const ICON_MAP = {
  building: Building,
  door: Door,
  wind: Wind,
  'panel-top': PanelTop,
  thermometer: Thermometer,
  fan: Fan,
  curtain: Curtain,
  table: Table,
  settings: Settings,
  'plus-circle': PlusCircle,
} as const;

interface ProjectBuilderProps {
  projectId: string;
  onBack: () => void;
}

export function ProjectBuilder({ projectId, onBack }: ProjectBuilderProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [project, setProject] = React.useState<Project | null>(null);
  const [selectedCategory, setSelectedCategory] = React.useState<Category | null>(null);
  const [description, setDescription] = React.useState<any>(null);
  const [modelName, setModelName] = React.useState('');
  const [modelDescription, setModelDescription] = React.useState('');
  const [savedStructure, setSavedStructure] = React.useState<any>(null);
  const [subcategories, setSubcategories] = React.useState<Subcategory[]>([]);
  const [options, setOptions] = React.useState<Option[]>([]);
  const [selections, setSelections] = React.useState<Record<string, string>>({});
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('display_order');

      if (error) {
        setError('Error loading categories: ' + error.message);
        return;
      }

      setCategories(data);
    };

    fetchCategories();
  }, []);

  React.useEffect(() => {
    const fetchProject = async () => {
      try {
        // Get the project first
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .single();

        if (projectError) {
          setError('Error loading project: ' + projectError.message);
          setLoading(false);
          return;
        }

        setProject(projectData);

        // Get the structure description
        const { data: description, error: descError } = await supabase
          .from('structure_descriptions')
          .select()
          .eq('project_id', projectId)
          .order('created_at', { ascending: false })
          .maybeSingle();

        if (descError) throw descError;

        if (description) {
          setDescription(description);
          setModelName(description.name);
          setModelDescription(description.description || '');
          
          // Fetch the latest structure model for this description
          const { data: structures, error: structureError } = await supabase
            .from('structure_models')
            .select('*, greenhouse_models(name)')
            .eq('description_id', description.id)
            .order('created_at', { ascending: false })
            .maybeSingle();

          if (structureError) {
            console.warn('Error fetching structure model:', structureError.message);
          } else if (structures && structures.length > 0) {
            setSavedStructure(structures[0]);
          }
        }

        // Fetch existing selections
        const { data: selectionsData, error: selectionsError } = await supabase
          .from('user_selections')
          .select('*')
          .eq('project_id', projectId);

        if (selectionsError) {
          setError('Error loading selections: ' + selectionsError.message);
          setLoading(false);
          return;
        }

        const selectionsMap: Record<string, string> = {};
        selectionsData.forEach((selection: UserSelection) => {
          selectionsMap[selection.subcategory_id] = selection.option_id;
        });
        setSelections(selectionsMap);

        setLoading(false);
      } catch (err) {
        setError('Error in fetchProject: ' + (err as Error).message);
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectId]);

  React.useEffect(() => {
    if (!selectedCategory) {
      setSubcategories([]);
      setOptions([]);
      return;
    }

    const fetchSubcategoriesAndOptions = async () => {
      setLoading(true);

      const [subcategoriesResult, optionsResult] = await Promise.all([
        supabase
          .from('subcategories')
          .select('*')
          .eq('category_id', selectedCategory.id)
          .order('display_order'),
        supabase
          .from('options')
          .select('*')
          .in('subcategory_id', subcategories.map(s => s.id))
      ]);

      if (subcategoriesResult.error) {
        setError('Error loading subcategories: ' + subcategoriesResult.error.message);
        setLoading(false);
        return;
      }

      if (optionsResult.error) {
        setError('Error loading options: ' + optionsResult.error.message);
        setLoading(false);
        return;
      }

      setSubcategories(subcategoriesResult.data);
      setOptions(optionsResult.data);
      setLoading(false);
    };

    fetchSubcategoriesAndOptions();
  }, [selectedCategory]);

  const handleOptionSelect = async (subcategoryId: string, optionId: string) => {
    setLoading(true);
    setError(null);

    const { error } = await supabase
      .from('user_selections')
      .upsert({
        project_id: projectId,
        subcategory_id: subcategoryId,
        option_id: optionId,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'project_id,subcategory_id'
      });

    if (error) {
      setError('Error saving selection: ' + error.message);
      setLoading(false);
      return;
    }

    setSelections(prev => ({
      ...prev,
      [subcategoryId]: optionId
    }));
    setLoading(false);
  };

  if (loading && !project) {
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

  if (!project) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-md">
        Project not found
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="sticky top-0 z-10 bg-white shadow-md border-b border-gray-200">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={onBack}
                className="flex items-center text-gray-600 hover:text-gray-900 shrink-0"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Projects
              </button>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 ml-4 truncate hidden sm:block">
                {selectedCategory ? selectedCategory.name : 'Choose a Category'}
              </h2>
            </div>
          </div>
          
          {selectedCategory && (
            <div className="py-2">
              <nav className="-mb-px flex flex-wrap gap-1 sm:gap-2">
                {categories.map((category) => {
                  const Icon = ICON_MAP[category.icon as keyof typeof ICON_MAP] || Building;
                  const isActive = selectedCategory.id === category.id;
                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category)}
                      className={`
                        flex items-center shrink-0 px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-md
                        ${isActive 
                          ? 'text-green-600 bg-green-50' 
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50/50'
                        }
                        transition-colors duration-150 ease-in-out
                      `}
                    >
                      <Icon className={`h-4 w-4 sm:mr-2 ${isActive ? 'text-green-600' : 'text-gray-400'}`} />
                      <span className="hidden sm:inline">{category.name}</span>
                      <span className="sm:hidden">{category.name.split(' ')[0]}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pt-6 px-4 sm:px-6 lg:px-8 pb-24 hide-scrollbar">
        {!selectedCategory ? (
          <CategoryList
            projectId={projectId}
            onSelectCategory={(category) => {
              setSelectedCategory(category);
              setSubcategories([]);
              setOptions([]);
            }}
          />
        ) : selectedCategory.name === 'Structure' ? (
          <StructureOptions
            projectId={projectId}
            onSelect={handleOptionSelect}
            selections={selections}
          />
        ) : selectedCategory.name === 'Vents' ? (
          <Vents projectId={projectId} />
        ) : selectedCategory.name === 'Doors and Vestibules' ? (
          <DoorsAndVestibules projectId={projectId} />
        ) : (
          <div className="space-y-8">
            {subcategories.map((subcategory) => (
              <div key={subcategory.id} className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {subcategory.name}
                </h3>
                {subcategory.description && (
                  <p className="text-gray-600 mb-6">{subcategory.description}</p>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {options
                    .filter(option => option.subcategory_id === subcategory.id)
                    .map((option) => (
                      <button
                        key={option.id}
                        onClick={() => handleOptionSelect(subcategory.id, option.id)}
                        className={`p-4 rounded-lg border-2 transition-colors ${
                          selections[subcategory.id] === option.id
                            ? 'border-green-600 bg-green-50'
                            : 'border-gray-200 hover:border-green-400'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-gray-900">{option.name}</h4>
                          <span className="text-green-600 font-semibold">
                            ${option.price.toFixed(2)}
                          </span>
                        </div>
                        {option.description && (
                          <p className="text-sm text-gray-600">{option.description}</p>
                        )}
                      </button>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}