"""
Annotation service for managing annotation workflow
Based on Tarteel's learnings about annotation processes
"""
import json
import os
from typing import List, Dict, Any
from datetime import datetime
from models import db, RecitationSession
from ml.annotation_model import Annotation, Annotator, AnnotationBatch

class AnnotationService:
    """Service for managing annotation workflow and data export"""
    
    @staticmethod
    def create_training_manifest(session_ids: List[int] = None, 
                                  output_format: str = 'jsonl',
                                  include_audio_path: bool = True) -> str:
        """
        Create training manifest in JSONL format
        Based on Tarteel's approach: JSON lines with audio path, label, and metadata
        
        Args:
            session_ids: List of session IDs to include (None = all annotated sessions)
            output_format: 'jsonl' or 'json'
            include_audio_path: Whether to include audio file paths
            
        Returns:
            Path to generated manifest file
        """
        # Query sessions with valid annotations
        query = db.session.query(RecitationSession).join(Annotation).filter(
            Annotation.status == 'completed',
            Annotation.is_correct == True
        )
        
        if session_ids:
            query = query.filter(RecitationSession.id.in_(session_ids))
        
        sessions = query.all()
        
        manifest_data = []
        
        for session in sessions:
            # Get the best annotation (first completed one)
            annotation = next(
                (a for a in session.annotations if a.status == 'completed' and a.is_correct),
                None
            )
            
            if not annotation:
                continue
            
            # Build manifest entry
            entry = {
                'session_id': session.id,
                'uuid': session.uuid,
                'verse_id': session.verse_id,
                'expected_text': session.expected_text,
                'transcribed_text': annotation.transcribed_text or session.transcribed_text,
                'accuracy_score': session.accuracy_score,
                'audio_duration_ms': session.audio_duration_ms,
                'audio_sample_rate': session.audio_sample_rate,
                'audio_channels': session.audio_channels,
                'user_id': session.user_id,
                'created_at': session.created_at.isoformat() if session.created_at else None
            }
            
            if include_audio_path and session.audio_file_path:
                entry['audio_file_path'] = session.audio_file_path
                # Also include S3 path if using cloud storage
                entry['audio_s3_key'] = f"recordings/{os.path.basename(session.audio_file_path)}"
            
            # Add annotation metadata
            entry['annotation'] = {
                'annotator_id': annotation.annotator_id,
                'has_proper_tashkeel': annotation.has_proper_tashkeel,
                'audio_quality': annotation.audio_quality,
                'is_complete': annotation.is_complete
            }
            
            manifest_data.append(entry)
        
        # Write to file
        output_dir = os.path.join(os.getcwd(), 'training_data')
        os.makedirs(output_dir, exist_ok=True)
        
        timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
        filename = f'training_manifest_{timestamp}.{output_format}'
        filepath = os.path.join(output_dir, filename)
        
        if output_format == 'jsonl':
            with open(filepath, 'w', encoding='utf-8') as f:
                for entry in manifest_data:
                    f.write(json.dumps(entry, ensure_ascii=False) + '\n')
        else:
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(manifest_data, f, ensure_ascii=False, indent=2)
        
        return filepath
    
    @staticmethod
    def get_annotation_statistics() -> Dict[str, Any]:
        """Get statistics about annotation progress"""
        total_sessions = RecitationSession.query.count()
        annotated_sessions = db.session.query(RecitationSession).join(Annotation).filter(
            Annotation.status == 'completed'
        ).distinct().count()
        
        total_annotations = Annotation.query.count()
        completed_annotations = Annotation.query.filter_by(status='completed').count()
        pending_annotations = Annotation.query.filter_by(status='pending').count()
        
        active_annotators = Annotator.query.filter_by(status='active').count()
        
        return {
            'total_sessions': total_sessions,
            'annotated_sessions': annotated_sessions,
            'annotation_coverage': (annotated_sessions / total_sessions * 100) if total_sessions > 0 else 0,
            'total_annotations': total_annotations,
            'completed_annotations': completed_annotations,
            'pending_annotations': pending_annotations,
            'active_annotators': active_annotators
        }
    
    @staticmethod
    def assign_batch_to_annotator(batch_id: int, annotator_id: int):
        """Assign an annotation batch to an annotator"""
        batch = AnnotationBatch.query.get_or_404(batch_id)
        annotator = Annotator.query.get_or_404(annotator_id)
        
        if annotator.status != 'active':
            raise ValueError(f"Annotator {annotator.name} is not active")
        
        batch.assigned_to = annotator_id
        batch.status = 'in_progress'
        db.session.commit()
        
        return batch
    
    @staticmethod
    def get_next_annotation_task(annotator_id: int) -> Dict[str, Any]:
        """Get next unannotated session for an annotator"""
        # Find sessions without annotations or with pending annotations
        annotated_session_ids = db.session.query(Annotation.session_id).filter(
            Annotation.annotator_id == annotator_id,
            Annotation.status.in_(['completed', 'in_progress'])
        ).subquery()
        
        session = RecitationSession.query.filter(
            ~RecitationSession.id.in_(db.session.query(annotated_session_ids)),
            RecitationSession.audio_file_path.isnot(None)
        ).first()
        
        if not session:
            return None
        
        return {
            'session_id': session.id,
            'verse_id': session.verse_id,
            'expected_text': session.expected_text,
            'audio_file_path': session.audio_file_path,
            'audio_duration_ms': session.audio_duration_ms,
            'user_id': session.user_id
        }

