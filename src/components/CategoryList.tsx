import React from 'react';
import { ChevronRight, Building, DoorOpen as Door, Wind, PanelTop, Thermometer, Fan, Mountain as Curtain, Table, Settings, PlusCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Category } from '../types/greenhouse';
import { DoorsAndVestibules } from './DoorsAndVestibules';

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

interface CategoryListProps {
  projectId: string;
  onSelectCategory: (category: Category) => void;
}

export function CategoryList({ projectId, onSelectCategory }: CategoryListProps) {
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('display_order');

      if (error) {
        setError('Error loading categories: ' + error.message);
        setLoading(false);
        return;
      }

      setCategories(data);
      setLoading(false);
    };

    fetchCategories();
  }, []);

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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {categories.map((category) => {
        const Icon = ICON_MAP[category.icon as keyof typeof ICON_MAP] || Building;
        return (
          <button
            key={category.id}
            onClick={() => {
              onSelectCategory(category);
            }}
            className="bg-white p-4 sm:p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow text-left group w-full"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 sm:space-x-3 mb-2 sm:mb-3">
                  <Icon className="h-6 w-6 text-green-600" />
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                    {category.name}
                  </h3>
                </div>
                {category.description && (
                  <p className="text-gray-600 text-sm">
                    {category.description}
                  </p>
                )}
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-green-600 transition-colors flex-shrink-0 ml-2" />
            </div>
          </button>
        );
      })}
    </div>
  );
}