import { configureStore } from "@reduxjs/toolkit"

import { stakingApi } from "./api/stakingApi"
import { tokensApi } from "./api/tokensApi"
import { tallyApi } from "./api/tallyApi"
import { treasuryApi } from "./api/treasuryApi"
import { governanceApi } from "./api/governanceStateApi"

export const store = configureStore({
  reducer: {
    // Add the stakingApi reducer
    [tokensApi.reducerPath]: tokensApi.reducer,
    [stakingApi.reducerPath]: stakingApi.reducer,
    [tallyApi.reducerPath]: tallyApi.reducer,
    [treasuryApi.reducerPath]: treasuryApi.reducer,
    [governanceApi.reducerPath]: governanceApi.reducer,
    // Add other reducers here if needed
  },
  // Adding the api middleware enables caching, invalidation, polling, and other features of RTK Query
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat([
      tokensApi.middleware,
      stakingApi.middleware,
      tallyApi.middleware,
      treasuryApi.middleware,
      governanceApi.middleware,
    ]),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
