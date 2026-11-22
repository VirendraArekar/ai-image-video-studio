import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { GeneratedMedia } from '../../types';

interface ActiveVideoJob {
  jobId: string;
  prompt: string;
  status: string;
  progress: number;
  creditCost: number;
  startedAt: string;
  media?: GeneratedMedia;
}

interface GenerationState {
  currentPrompt: string;
  currentNegativePrompt: string;
  selectedStyle: string;
  selectedAspectRatio: string;
  activeVideoJobs: ActiveVideoJob[];
  lastGeneratedMedia: GeneratedMedia | null;
}

const initialState: GenerationState = {
  currentPrompt: '',
  currentNegativePrompt: '',
  selectedStyle: 'Cinematic',
  selectedAspectRatio: '1:1',
  activeVideoJobs: [],
  lastGeneratedMedia: null,
};

export const generationSlice = createSlice({
  name: 'generation',
  initialState,
  reducers: {
    setPromptData: (
      state,
      action: PayloadAction<{ prompt: string; negativePrompt?: string; style?: string }>,
    ) => {
      state.currentPrompt = action.payload.prompt;
      if (action.payload.negativePrompt) {
        state.currentNegativePrompt = action.payload.negativePrompt;
      }
      if (action.payload.style) {
        state.selectedStyle = action.payload.style;
      }
    },
    setLastGenerated: (state, action: PayloadAction<GeneratedMedia | null>) => {
      state.lastGeneratedMedia = action.payload;
    },
    addVideoJob: (state, action: PayloadAction<ActiveVideoJob>) => {
      state.activeVideoJobs.unshift(action.payload);
    },
    updateVideoJob: (
      state,
      action: PayloadAction<{ jobId: string; status: string; progress: number; media?: GeneratedMedia }>,
    ) => {
      const job = state.activeVideoJobs.find((j) => j.jobId === action.payload.jobId);
      if (job) {
        job.status = action.payload.status;
        job.progress = action.payload.progress;
        if (action.payload.media) {
          job.media = action.payload.media;
        }
      }
    },
    removeVideoJob: (state, action: PayloadAction<string>) => {
      state.activeVideoJobs = state.activeVideoJobs.filter((j) => j.jobId !== action.payload);
    },
  },
});

export const { setPromptData, setLastGenerated, addVideoJob, updateVideoJob, removeVideoJob } =
  generationSlice.actions;

export default generationSlice.reducer;
