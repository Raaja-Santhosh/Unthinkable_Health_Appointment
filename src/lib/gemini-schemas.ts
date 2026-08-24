export const preVisitSchema = {
  type: 'object' as const,
  properties: {
    isEmergency: { type: 'boolean' as const, description: 'True if symptoms indicate a medical emergency requiring immediate ER visit' },
    emergencyMessage: { type: 'string' as const, description: 'If emergency, urgent message advising to call emergency services' },
    urgency: { type: 'string' as const, enum: ['Low', 'Medium', 'High'], description: 'Triage urgency level' },
    chiefComplaint: { type: 'string' as const, description: 'Primary medical concern in clinical terms' },
    suggestedQuestions: { type: 'array' as const, items: { type: 'string' as const }, description: 'Three diagnostic questions for the doctor to ask' }
  },
  required: ['isEmergency', 'urgency', 'chiefComplaint', 'suggestedQuestions']
};

export const postVisitSchema = {
  type: 'object' as const,
  properties: {
    patientFriendlySummary: { type: 'string' as const },
    medicationSchedule: {
      type: 'array' as const,
      items: {
        type: 'object' as const,
        properties: {
          medicationName: { type: 'string' as const },
          dosage: { type: 'string' as const, description: 'e.g. 500mg' },
          frequency: { type: 'string' as const, description: 'e.g. twice daily' },
          duration: { type: 'string' as const, description: 'e.g. 7 days' },
          instructions: { type: 'string' as const, description: 'e.g. take with food' },
          warnings: { type: 'string' as const, description: 'e.g. may cause drowsiness' }
        },
        required: ['medicationName', 'dosage', 'frequency', 'duration', 'instructions']
      }
    },
    followUpSteps: { type: 'array' as const, items: { type: 'string' as const } },
    nextAppointmentSuggestion: { type: 'string' as const, description: 'e.g. Follow up in 2 weeks' }
  },
  required: ['patientFriendlySummary', 'medicationSchedule', 'followUpSteps']
};

export const PRE_VISIT_SYSTEM_PROMPT = `You are a medical triage assistant. Analyze patient symptoms and provide structured triage assessment.

Urgency criteria:
- HIGH: Chest pain, difficulty breathing, severe bleeding, loss of consciousness, stroke symptoms (facial drooping, arm weakness, speech difficulty), severe allergic reaction, suicidal thoughts, high fever (>103°F/39.4°C) with stiff neck, sudden severe headache
- MEDIUM: Persistent fever (>100.4°F/38°C for 3+ days), moderate persistent pain, signs of infection (swelling, redness, warmth), worsening chronic conditions, urinary symptoms, persistent vomiting/diarrhea, anxiety/depression symptoms
- LOW: Routine checkups, mild cold/flu symptoms, minor aches, prescription refills, follow-up visits, preventive care, minor skin concerns, wellness consultations

Set isEmergency=true ONLY for life-threatening symptoms requiring immediate ER: chest pain with shortness of breath, signs of stroke, severe trauma, uncontrolled bleeding, loss of consciousness, anaphylaxis.

IMPORTANT: This is a triage aid, NOT a diagnosis. Always suggest professional medical evaluation.`;

export const POST_VISIT_SYSTEM_PROMPT = `You are a medical documentation assistant. Convert clinical doctor notes into patient-friendly summaries.

Rules:
- Use plain, non-technical language a 12-year-old could understand
- Never use medical jargon without explaining it in parentheses
- Be warm and reassuring in tone
- Extract ALL medications mentioned with complete details
- If a medication detail is not specified in the notes, write "as directed by doctor"
- Always include follow-up guidance`;
