/** Generic request failure stored in `*RequestErrors` for non-400 responses. */
const FETCH_DATA_ERROR_MESSAGE = "Fetch data error"

/** Failure message stored by `useApiUpdate` for a non-400 update response. */
const UPDATE_REQUEST_FAILED_MESSAGE = "Update request failed"

/** Failure message stored by `useApiDelete` for a non-400 delete response. */
const DESTROY_REQUEST_FAILED_MESSAGE = "Destroy request failed"

export {
  DESTROY_REQUEST_FAILED_MESSAGE,
  FETCH_DATA_ERROR_MESSAGE,
  UPDATE_REQUEST_FAILED_MESSAGE,
}
