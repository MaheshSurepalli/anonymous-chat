import React, { createContext, useContext, useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

export type TutorialStep = 'welcome' | 'settings' | 'start' | null

type OnboardingContextValue = {
    activeStep: TutorialStep
    startTutorial: () => void
    skipTutorial: () => void
    nextStep: () => void
    hasSeenTutorial: boolean
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null)

const STEPS: TutorialStep[] = ['welcome', 'settings', 'start']
const STORAGE_KEY = 'STRANGER_CHAT_HAS_SEEN_TUTORIAL_V1'

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
    const [activeStep, setActiveStep] = useState<TutorialStep>(null)
    const [hasSeenTutorial, setHasSeenTutorial] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        AsyncStorage.getItem(STORAGE_KEY).then((val) => {
            setHasSeenTutorial(!!val)
            if (!val) {
                // Start tutorial automatically if not seen
                setActiveStep('welcome')
            }
            setLoading(false)
        })
    }, [])

    const startTutorial = () => {
        setActiveStep('welcome')
    }

    const skipTutorial = async () => {
        setActiveStep(null)
        setHasSeenTutorial(true)
        await AsyncStorage.setItem(STORAGE_KEY, 'true')
    }

    const nextStep = async () => {
        if (!activeStep) return

        const currentIndex = STEPS.indexOf(activeStep)
        if (currentIndex < STEPS.length - 1) {
            setActiveStep(STEPS[currentIndex + 1])
        } else {
            // Finished
            await skipTutorial()
        }
    }

    return (
        <OnboardingContext.Provider value={{
            activeStep,
            startTutorial,
            skipTutorial,
            nextStep,
            hasSeenTutorial
        }}>
            {!loading && children}
        </OnboardingContext.Provider>
    )
}

export function useOnboarding() {
    const ctx = useContext(OnboardingContext)
    if (!ctx) throw new Error('useOnboarding must be used within OnboardingProvider')
    return ctx
}
