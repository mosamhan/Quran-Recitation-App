# Annotation System for ML Training

Based on [Tarteel's ML Journey: Part 2 - Data Annotation](https://tarteel.ai/blog/tarteels-ml-journey-part-2/)

## Overview

This document outlines the annotation system implemented for collecting and labeling recitation data to train ML models. The system follows Tarteel's proven approach while adapting to our specific needs.

## Key Components

### 1. Data Models

#### Annotator Model
- Stores annotator information (name, email, qualifications)
- Tracks performance (total annotations, accuracy score)
- Manages status (active, inactive, training, suspended)
- Supports manager role for team management

#### Annotation Model
- Links recitation sessions to annotators
- Stores annotation results (correct/incorrect, complete/incomplete)
- Includes quality metrics (audio quality, background noise, clarity)
- Supports detailed feedback (transcribed text, corrected text, notes)
- Tracks review status (pending, completed, reviewed, rejected)

#### AnnotationBatch Model
- Manages batches of annotation tasks
- Tracks progress and completion
- Supports priority levels
- Assigns batches to annotators

### 2. Annotation Workflow

#### Step 1: Annotator Onboarding
1. Create annotator profile
2. Test with sample files
3. Training phase
4. Activate when qualified

#### Step 2: Task Assignment
- Annotators get next unannotated session
- Can be assigned specific batches
- Tracks progress automatically

#### Step 3: Annotation Process
1. Annotator listens to recording
2. Compares with expected verse text
3. Marks as correct/incorrect
4. Adds detailed feedback if needed
5. Flags quality issues
6. Submits annotation

#### Step 4: Review Process
- Managers review annotations
- Can approve or reject
- Provides feedback to annotators
- Updates accuracy scores

### 3. Training Data Export

#### Manifest Generation
- Creates JSONL format (JSON Lines) like Tarteel
- Each line contains:
  - Session metadata
  - Audio file path
  - Expected and transcribed text
  - Annotation details
  - Quality metrics

#### Data Preprocessing
- Batch audio conversion using ffmpeg
- Standardization (16kHz, mono, WAV)
- Validation of manifest files
- Statistics generation

## API Endpoints

### Annotator Management
- `GET /api/annotators` - List annotators
- `POST /api/annotators` - Create annotator
- `GET /api/annotators/<id>` - Get annotator details
- `PUT /api/annotators/<id>` - Update annotator

### Annotation Tasks
- `POST /api/annotations` - Create annotation
- `GET /api/annotations/next-task` - Get next task for annotator
- `GET /api/annotations/stats` - Get annotation statistics

### Batch Management
- `GET /api/annotation/batches` - List batches
- `POST /api/annotation/batches` - Create batch

### Training Data
- `POST /api/training/manifest` - Generate training manifest
- `POST /api/training/preprocess` - Preprocess audio files
- `POST /api/training/validate` - Validate dataset
- `POST /api/training/stats` - Get dataset statistics

## Lessons from Tarteel

### What Worked for Tarteel
1. **In-house contractor management**: Hiring someone to manage annotator team
2. **Custom tools**: Building on Retool for flexibility
3. **Quality over quantity**: Proper vetting of annotators
4. **JSONL format**: Simple, scalable manifest format
5. **Batch processing**: Using find + parallel + ffmpeg

### What to Avoid
1. **Crowdsourcing without management**: Too overwhelming
2. **Overfitting data model**: Too tightly coupled to domain
3. **Complex third-party tools**: GroundTruth was too complicated
4. **No RBAC**: Security issues with free LabelStudio
5. **Poor validation**: Not checking data quality early

## Implementation Recommendations

### Phase 1: Basic Annotation (Current)
- ✅ Data models created
- ✅ API endpoints implemented
- ✅ Training manifest generation
- ⏳ Frontend annotation interface needed

### Phase 2: Annotation Interface
- Build simple annotation UI (similar to Tarteel's Retool interface)
- Audio playback controls
- Text comparison view
- Quality assessment tools
- Progress tracking

### Phase 3: Management Tools
- Annotator dashboard
- Batch management interface
- Review and approval workflow
- Performance analytics

### Phase 4: Quality Assurance
- Inter-annotator agreement tracking
- Automatic quality checks
- Flagging problematic annotations
- Continuous improvement process

## Data Format

### Training Manifest (JSONL)
```json
{
  "session_id": 123,
  "uuid": "550e8400-e29b-41d4-a716-446655440000",
  "verse_id": "1:1",
  "expected_text": "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
  "transcribed_text": "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
  "accuracy_score": 95.5,
  "audio_file_path": "/recordings/1_1_uuid.wav",
  "audio_duration_ms": 3500,
  "audio_sample_rate": 16000,
  "audio_channels": 1,
  "annotation": {
    "annotator_id": 1,
    "has_proper_tashkeel": true,
    "audio_quality": "good",
    "is_complete": true
  }
}
```

## Next Steps

1. **Build annotation interface** - Simple web UI for annotators
2. **Recruit annotators** - Find qualified Arabic speakers with Tajweed knowledge
3. **Start annotation** - Begin labeling collected recordings
4. **Generate training data** - Export manifests for model training
5. **Train models** - Use annotated data to train custom ASR models

## References

- [Tarteel's ML Journey: Part 2 - Data Annotation](https://tarteel.ai/blog/tarteels-ml-journey-part-2/)
- [Tarteel's ML Journey: Part 1 - Data Collection](https://tarteel.ai/blog/tarteels-ml-journey-part-1-intro-data-collection/)



