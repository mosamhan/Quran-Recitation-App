"""
Data preprocessing utilities for ML training
Based on Tarteel's approach to data preparation
"""
import os
import subprocess
from typing import List, Dict, Any
import json

class DataPreprocessor:
    """Preprocess audio files for ML training"""
    
    @staticmethod
    def batch_convert_audio(input_dir: str, 
                           output_dir: str,
                           sample_rate: int = 16000,
                           channels: int = 1,
                           format: str = 'wav',
                           extension: str = 'webm') -> Dict[str, Any]:
        """
        Batch convert audio files using ffmpeg
        Based on Tarteel's approach using find + parallel + ffmpeg
        
        Args:
            input_dir: Directory containing input audio files
            output_dir: Directory for output files
            sample_rate: Target sample rate (Hz)
            channels: Number of channels (1 = mono, 2 = stereo)
            format: Output format (wav, mp3, etc.)
            extension: Input file extension
            
        Returns:
            Dict with conversion statistics
        """
        os.makedirs(output_dir, exist_ok=True)
        
        # Build ffmpeg command template
        # Using find + parallel approach like Tarteel
        cmd = f"""
        find {input_dir} -type f -name '*.{extension}' -print0 | \
        parallel --bar -0 ffmpeg -y -hide_banner -loglevel error \
        -i {{}} -ar {sample_rate} -ac {channels} \
        {output_dir}/{{/.}}.{format}
        """
        
        try:
            result = subprocess.run(
                cmd,
                shell=True,
                capture_output=True,
                text=True,
                check=True
            )
            
            # Count converted files
            converted_files = len([f for f in os.listdir(output_dir) if f.endswith(f'.{format}')])
            
            return {
                'success': True,
                'converted_files': converted_files,
                'output_dir': output_dir,
                'message': f'Successfully converted {converted_files} files'
            }
        except subprocess.CalledProcessError as e:
            return {
                'success': False,
                'error': str(e),
                'stderr': e.stderr
            }
    
    @staticmethod
    def validate_training_dataset(manifest_path: str) -> Dict[str, Any]:
        """
        Validate training dataset manifest
        
        Args:
            manifest_path: Path to JSONL manifest file
            
        Returns:
            Validation results
        """
        issues = []
        total_entries = 0
        valid_entries = 0
        
        try:
            with open(manifest_path, 'r', encoding='utf-8') as f:
                for line_num, line in enumerate(f, 1):
                    total_entries += 1
                    try:
                        entry = json.loads(line.strip())
                        
                        # Validate required fields
                        required_fields = ['session_id', 'verse_id', 'expected_text', 'transcribed_text']
                        missing_fields = [f for f in required_fields if f not in entry]
                        
                        if missing_fields:
                            issues.append({
                                'line': line_num,
                                'type': 'missing_fields',
                                'fields': missing_fields
                            })
                            continue
                        
                        # Validate audio file exists if path provided
                        if 'audio_file_path' in entry and entry['audio_file_path']:
                            if not os.path.exists(entry['audio_file_path']):
                                issues.append({
                                    'line': line_num,
                                    'type': 'missing_audio_file',
                                    'path': entry['audio_file_path']
                                })
                                continue
                        
                        valid_entries += 1
                        
                    except json.JSONDecodeError as e:
                        issues.append({
                            'line': line_num,
                            'type': 'invalid_json',
                            'error': str(e)
                        })
        except FileNotFoundError:
            return {
                'valid': False,
                'error': f'Manifest file not found: {manifest_path}'
            }
        
        return {
            'valid': len(issues) == 0,
            'total_entries': total_entries,
            'valid_entries': valid_entries,
            'invalid_entries': total_entries - valid_entries,
            'issues': issues,
            'validation_rate': (valid_entries / total_entries * 100) if total_entries > 0 else 0
        }
    
    @staticmethod
    def get_dataset_statistics(manifest_path: str) -> Dict[str, Any]:
        """Get statistics about the training dataset"""
        stats = {
            'total_samples': 0,
            'total_duration_hours': 0,
            'unique_verses': set(),
            'unique_users': set(),
            'sample_rates': {},
            'channels': {},
            'quality_distribution': {}
        }
        
        try:
            with open(manifest_path, 'r', encoding='utf-8') as f:
                for line in f:
                    entry = json.loads(line.strip())
                    stats['total_samples'] += 1
                    
                    if 'verse_id' in entry:
                        stats['unique_verses'].add(entry['verse_id'])
                    
                    if 'user_id' in entry:
                        stats['unique_users'].add(entry['user_id'])
                    
                    if 'audio_duration_ms' in entry and entry['audio_duration_ms']:
                        stats['total_duration_hours'] += entry['audio_duration_ms'] / (1000 * 60 * 60)
                    
                    if 'audio_sample_rate' in entry:
                        sr = entry['audio_sample_rate']
                        stats['sample_rates'][sr] = stats['sample_rates'].get(sr, 0) + 1
                    
                    if 'audio_channels' in entry:
                        ch = entry['audio_channels']
                        stats['channels'][ch] = stats['channels'].get(ch, 0) + 1
                    
                    if 'annotation' in entry and 'audio_quality' in entry['annotation']:
                        quality = entry['annotation']['audio_quality']
                        stats['quality_distribution'][quality] = stats['quality_distribution'].get(quality, 0) + 1
        except FileNotFoundError:
            return {'error': 'Manifest file not found'}
        
        return {
            'total_samples': stats['total_samples'],
            'total_duration_hours': round(stats['total_duration_hours'], 2),
            'unique_verses': len(stats['unique_verses']),
            'unique_users': len(stats['unique_users']),
            'sample_rate_distribution': stats['sample_rates'],
            'channel_distribution': stats['channels'],
            'quality_distribution': stats['quality_distribution']
        }

