use thiserror::Error;

#[derive(serde::Serialize, Debug, Clone)]
#[serde(tag = "kind")]
pub enum UnexpectedErr {
    LockError,
    MPSCClosedError,
}

#[derive(serde::Serialize, Debug, Clone, Error)]
#[serde(tag = "type")]
pub enum ABAPIError {
    #[error("Unexpected error: {inner:?}")]
    Unexpected { inner: UnexpectedErr },
    #[error("SomethingWrong: {msg:?}")]
    SomethingWrong { msg: String },
}
