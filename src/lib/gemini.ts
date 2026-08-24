import { GoogleGenAI } from '@google/genai'
import { 
  preVisitSchema, 
  postVisitSchema, 
  PRE_VISIT_SYSTEM_PROMPT, 
  POST_VISIT_SYSTEM_PROMPT 
} from './gemini-schemas'

export const MEDICAL_DISCLAIMER = "\n\nDisclaimer: This is an AI-generated summary and not a substitute for professional medical advice."

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'fake-key' })

export async function generatePreVisitSummary(symptoms: string) {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: symptoms,
      config: {
        responseMimeType: 'application/json',
        responseSchema: preVisitSchema,
        systemInstruction: PRE_VISIT_SYSTEM_PROMPT,
      }
    })
    
    return JSON.parse(response.text || '{}')
  } catch (error) {
    console.error("Gemini Error:", error)
    // Fallback if LLM fails gracefully
    return {
      isEmergency: false,
      emergencyMessage: "",
      urgency: "Medium",
      chiefComplaint: "Unknown (AI generation failed)",
      suggestedQuestions: []
    }
  }
}

export async function generatePostVisitSummary(notes: string) {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: notes,
      config: {
        responseMimeType: 'application/json',
        responseSchema: postVisitSchema,
        systemInstruction: POST_VISIT_SYSTEM_PROMPT,
      }
    })
    
    const result = JSON.parse(response.text || '{}')
    if (result.patientFriendlySummary) {
      result.patientFriendlySummary += MEDICAL_DISCLAIMER
    }
    return result
  } catch (error) {
    console.error("Gemini Error:", error)
    return {
      patientFriendlySummary: "Notes recorded. (AI generation failed)" + MEDICAL_DISCLAIMER,
      medicationSchedule: [],
      followUpSteps: [],
      nextAppointmentSuggestion: ""
    }
  }
}
