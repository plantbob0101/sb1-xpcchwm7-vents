import React from 'react';

interface UnitCalculatorProps {
  ranges: number;
  houses: number;
  houseLength: number;
  width: string;
  gutterConnect?: boolean;
  concreteSlab?: string;
  gutterPartitions?: number;
  gablePartitions?: number;
}

interface UnitCounts {
  A: number;  // End bays on starter house
  B: number;  // Mid bays on starter house
  C: number;  // End bays on additional houses
  D: number;  // Mid bays on additional houses
  baseAngel?: number;  // Base Angel calculation result
  baseStringer?: number;  // Base Stringer calculation result
  baBolts?: number;  // BA Bolts calculation result
}

function calculateUnits(
  ranges: number, 
  houses: number, 
  houseLength: number, 
  width: string,
  gutterConnect: boolean = true,
  concreteSlab: string = 'No',
  gutterPartitions: number = 0,
  gablePartitions: number = 0
): UnitCounts {
  const BASE_LENGTH = 21; // Length covered by A units (in feet)
  const BAY_LENGTH = 12;  // Length of each mid bay (in feet)
  
  // Parse numeric width
  const numericWidth = parseFloat(width);
  
  // Calculate B units for a single house
  const midBaysPerHouse = Math.max(0, Math.floor((houseLength - BASE_LENGTH) / BAY_LENGTH));

  let units: UnitCounts;

  if (gutterConnect) {
    // Original calculation for gutter-connected houses
    units = {
      A: 2, // Always 2 end bays for the starter house
      B: midBaysPerHouse, // Mid bays for starter house
      C: 2 * (houses - 1), // 2 end bays for each additional house
      D: midBaysPerHouse * (houses - 1) // Mid bays for additional houses
    };
  } else {
    // For non-gutter-connected houses, multiply A and B units by the number of houses
    // C and D units are not used
    units = {
      A: 2 * houses, // 2 end bays for each house
      B: midBaysPerHouse * houses, // Mid bays for each house
      C: 0, // No C units for non-gutter-connected houses
      D: 0  // No D units for non-gutter-connected houses
    };
  }

  // Calculate total perimeter length in feet
  const totalLength = (
    (numericWidth * (units.A + units.C)) + 
    (houseLength * units.A) + 
    (gutterPartitions * houseLength) + 
    (gablePartitions * numericWidth)
  );

  // For concrete slab, calculate Base Angel and BA Bolts
  if (concreteSlab === 'Yes') {
    units.baseAngle = totalLength / 12; // Convert to 12ft sections
    units.baBolts = Math.ceil(units.baseAngle * 5); // 5 bolts per 12ft section, rounded up
    units.baseStringer = undefined; // Clear base stringer when using concrete slab
  } 
  // For no concrete slab, calculate Base Stringer
  else if (concreteSlab === 'No') {
    units.baseStringer = totalLength; // Use total length in feet
    units.baseAngle = undefined; // Clear base angle when not using concrete slab
    units.baBolts = undefined; // Clear BA bolts when not using concrete slab
  }
  // When concrete_slab is not set, don't show either calculation
  else {
    units.baseAngle = undefined;
    units.baBolts = undefined;
    units.baseStringer = undefined;
  }

  return units;
}

export function UnitCalculator({ 
  ranges, 
  houses, 
  houseLength, 
  width,
  gutterConnect = true,
  concreteSlab = 'No',
  gutterPartitions = 0,
  gablePartitions = 0
}: UnitCalculatorProps) {
  const units = calculateUnits(
    ranges, 
    houses, 
    houseLength, 
    width,
    gutterConnect,
    concreteSlab,
    gutterPartitions,
    gablePartitions
  );

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Unit Breakdown</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-sm text-gray-500">A Units</div>
          <div className="text-lg font-medium">{units.A}</div>
          <div className="text-xs text-gray-500 mt-1">End bays</div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-sm text-gray-500">B Units</div>
          <div className="text-lg font-medium">{units.B}</div>
          <div className="text-xs text-gray-500 mt-1">Mid bays</div>
        </div>
        {gutterConnect && (
          <>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500">C Units</div>
              <div className="text-lg font-medium">{units.C}</div>
              <div className="text-xs text-gray-500 mt-1">End bays (additional ranges)</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500">D Units</div>
              <div className="text-lg font-medium">{units.D}</div>
              <div className="text-xs text-gray-500 mt-1">Mid bays (additional ranges)</div>
            </div>
          </>
        )}
      </div>

      {/* Base Calculations */}
      <div className="mt-6">
        <h4 className="text-md font-semibold text-gray-900 mb-3">Base Calculations</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {units.baseAngle !== undefined && (
            <>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-500">Base Angle</div>
                <div className="text-lg font-medium">{units.baseAngle.toFixed(2)}</div>
                <div className="text-xs text-gray-500 mt-1">12ft sections</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-500">BA Bolts</div>
                <div className="text-lg font-medium">{units.baBolts?.toFixed(0)}</div>
                <div className="text-xs text-gray-500 mt-1">Total bolts needed</div>
              </div>
            </>
          )}
          {units.baseStringer !== undefined && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500">Base Stringer</div>
              <div className="text-lg font-medium">{units.baseStringer.toFixed(2)}</div>
              <div className="text-xs text-gray-500 mt-1">Linear feet</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export type { UnitCalculatorProps, UnitCounts };