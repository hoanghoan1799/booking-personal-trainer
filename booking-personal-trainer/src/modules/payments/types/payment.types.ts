export type TrainerPayoutMetadata = {
  readonly status:
    | 'TRANSFERRED'
    | 'AWAITING_TRAINER_CONNECT'
    | 'SKIPPED_ZERO_SHARE'
    | 'FAILED';
  readonly transferId?: string;
  readonly errorMessage?: string;
};
