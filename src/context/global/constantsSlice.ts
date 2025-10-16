// src/features/constants/constantsSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { API_URL } from "../../constants"
import axios from "axios"

export interface ConstantsState {
  data: Record<string, any> | null
  status: "idle" | "loading" | "succeeded" | "failed"
  error: string | null
}

const initialState: ConstantsState = {
  data: null,
  status: "idle",
  error: null,
}

// Thunk to fetch constants
export const fetchConstants = createAsyncThunk(
  "constants/fetchConstants",
  async () => {
    const response = await axios.get(`${API_URL}/api/v1/constants`)
    return response.data
  },
)

const constantsSlice = createSlice({
  name: "constants",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchConstants.pending, (state) => {
        state.status = "loading"
        state.error = null
      })
      .addCase(fetchConstants.fulfilled, (state, action) => {
        state.status = "succeeded"
        state.data = action.payload
      })
      .addCase(fetchConstants.rejected, (state, action) => {
        state.status = "failed"
        state.error = action.error.message ?? "Failed to fetch constants"
      })
  },
})

export default constantsSlice.reducer
