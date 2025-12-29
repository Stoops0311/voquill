-- Add token tracking columns for transcription and post-processing
ALTER TABLE transcriptions ADD COLUMN transcription_input_tokens INTEGER;
ALTER TABLE transcriptions ADD COLUMN transcription_output_tokens INTEGER;
ALTER TABLE transcriptions ADD COLUMN postprocessing_input_tokens INTEGER;
ALTER TABLE transcriptions ADD COLUMN postprocessing_output_tokens INTEGER;
ALTER TABLE transcriptions ADD COLUMN total_tokens INTEGER;

-- Add cost tracking columns (stored as REAL for USD amounts)
ALTER TABLE transcriptions ADD COLUMN transcription_cost_usd REAL;
ALTER TABLE transcriptions ADD COLUMN postprocessing_cost_usd REAL;
ALTER TABLE transcriptions ADD COLUMN total_cost_usd REAL;
