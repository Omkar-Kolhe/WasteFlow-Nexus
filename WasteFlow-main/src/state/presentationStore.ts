import { create } from 'zustand'

export type PresentationStepId =
  | 'intro'
  | 'city'
  | 'flow'
  | 'problem'
  | 'root-cause'
  | 'what-if'
  | 'network-responds'
  | 'impact'
  | 'overview'

interface PresentationStore {
  isActive: boolean
  currentStep: PresentationStepId
  startDemo: () => void
  stopDemo: () => void
  setStep: (step: PresentationStepId) => void
  nextStep: () => void
  prevStep: () => void
}

const STEPS: PresentationStepId[] = [
  'intro',
  'city',
  'flow',
  'problem',
  'root-cause',
  'what-if',
  'network-responds',
  'impact',
  'overview'
]

export const usePresentationStore = create<PresentationStore>((set, get) => ({
  isActive: false,
  currentStep: 'intro',
  startDemo: () => set({ isActive: true, currentStep: 'intro' }),
  stopDemo: () => set({ isActive: false }),
  setStep: (step) => set({ currentStep: step }),
  nextStep: () => {
    const { currentStep } = get()
    const idx = STEPS.indexOf(currentStep)
    if (idx < STEPS.length - 1) {
      set({ currentStep: STEPS[idx + 1] })
    }
  },
  prevStep: () => {
    const { currentStep } = get()
    const idx = STEPS.indexOf(currentStep)
    if (idx > 0) {
      set({ currentStep: STEPS[idx - 1] })
    }
  }
}))
