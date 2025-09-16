-- Clean up duplicate participants for the specific meeting
DELETE FROM meeting_participants 
WHERE meeting_id = '6b73c955-9188-4bd2-86c4-b5097b93cf6d';

-- Re-insert unique participants for this meeting
INSERT INTO meeting_participants (meeting_id, name, role, speaking_time_seconds) VALUES
('6b73c955-9188-4bd2-86c4-b5097b93cf6d', 'Antonio Foresti', 'attendee', 292),
('6b73c955-9188-4bd2-86c4-b5097b93cf6d', 'Bruno Koppe Muccillo', 'attendee', 0),
('6b73c955-9188-4bd2-86c4-b5097b93cf6d', 'Carlos Lima', 'attendee', 546),
('6b73c955-9188-4bd2-86c4-b5097b93cf6d', 'Emilly Rodrigues Campos', 'attendee', 76),
('6b73c955-9188-4bd2-86c4-b5097b93cf6d', 'João Victor', 'attendee', 0),
('6b73c955-9188-4bd2-86c4-b5097b93cf6d', 'Lovani Goreti Zerwes', 'attendee', 117),
('6b73c955-9188-4bd2-86c4-b5097b93cf6d', 'Matheus Barbosa', 'attendee', 997),
('6b73c955-9188-4bd2-86c4-b5097b93cf6d', 'Tiago Palmeira', 'attendee', 0);

-- Update the meeting participant count to reflect the correct number
UPDATE meetings 
SET total_participant_count = 8, external_participant_count = 8
WHERE id = '6b73c955-9188-4bd2-86c4-b5097b93cf6d';