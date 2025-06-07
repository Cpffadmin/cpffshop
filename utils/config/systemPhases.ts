export const PHASE_STATUS = {
  PLANNING: "planning",
  IN_PROGRESS: "in_progress",
  TESTING: "testing",
  COMPLETED: "completed",
  ROLLED_BACK: "rolled_back",
} as const;

export const BRAND_SYSTEM_PHASES = {
  PHASE_1: {
    name: "Foundation Setup",
    status: PHASE_STATUS.IN_PROGRESS,
    currentStep: 1,
    totalSteps: 3,
    steps: [
      {
        id: 1,
        name: "Create BrandBeta model and feature flags",
        status: PHASE_STATUS.IN_PROGRESS,
      },
      {
        id: 2,
        name: "Setup basic admin panel",
        status: PHASE_STATUS.PLANNING,
      },
      {
        id: 3,
        name: "Create data sync utilities",
        status: PHASE_STATUS.PLANNING,
      },
    ],
  },
  PHASE_2: {
    name: "Component Creation",
    status: PHASE_STATUS.PLANNING,
    currentStep: 0,
    totalSteps: 3,
    steps: [
      {
        id: 1,
        name: "Create BrandSelector beta component",
        status: PHASE_STATUS.PLANNING,
      },
      {
        id: 2,
        name: "Integrate with existing CategoryMenu",
        status: PHASE_STATUS.PLANNING,
      },
      {
        id: 3,
        name: "Add brand management UI",
        status: PHASE_STATUS.PLANNING,
      },
    ],
  },
} as const;

export type PhaseStatus = keyof typeof PHASE_STATUS;
export type PhaseId = keyof typeof BRAND_SYSTEM_PHASES;
