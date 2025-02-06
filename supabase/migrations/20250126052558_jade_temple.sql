/*
  # Add new structure fields

  1. New Fields
    - Added various new fields to structure_models table for detailed greenhouse specifications
    - Added text fields for specifications like upgrades, concrete, power, etc.
    - Added numeric fields for zones, elevation, and partitions
    - Added fields for future calculations

  2. Changes
    - Modified structure_models table to include new fields
    - All fields are nullable to maintain compatibility with existing records
*/

ALTER TABLE structure_models
ADD COLUMN structural_upgrades text,
ADD COLUMN zones integer,
ADD COLUMN concrete_slab text,
ADD COLUMN phase_voltage text,
ADD COLUMN nat_gas_propane text,
ADD COLUMN elevation numeric,
ADD COLUMN temps_climate text,
ADD COLUMN roof text,
ADD COLUMN roof_vent text,
ADD COLUMN sidewalls text,
ADD COLUMN endwalls text,
ADD COLUMN upper_gables text,
ADD COLUMN gutter_partitions integer,
ADD COLUMN gable_partitions integer,
ADD COLUMN stemwall text,
ADD COLUMN endwall_transitions numeric,
ADD COLUMN base_angel_12ft numeric,
ADD COLUMN ba_bolts numeric,
ADD COLUMN base_stringer numeric;