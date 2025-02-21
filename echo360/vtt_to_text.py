import os
import re
import sys
from pathlib import Path

def clean_vtt_line(line):
    """Remove speaker tags, HTML tags, confidence notes and other non-text content."""
    # Remove speaker tags like <v Speaker 0>
    line = re.sub(r'<v\s+[^>]+>', '', line)
    # Remove any other HTML-like tags
    line = re.sub(r'<[^>]+>', '', line)
    # Remove confidence notes
    if line.startswith('NOTE CONF'):
        return ''
    # Remove filler words and clean up spacing
    line = re.sub(r'\b(um|uh|er|like)\b', '', line, flags=re.IGNORECASE)
    # Clean up multiple spaces
    line = re.sub(r'\s+', ' ', line)
    return line.strip()

def convert_vtt_to_text(vtt_path, output_dir=None):
    """Convert a VTT file to clean text, removing all metadata and timestamps."""
    if output_dir is None:
        # If no output directory specified, use the clean directory parallel to dirty
        base_dir = os.path.dirname(os.path.dirname(vtt_path))  # Go up two levels (past dirty/course_name)
        rel_path = os.path.relpath(os.path.dirname(vtt_path), os.path.join(base_dir, "dirty"))
        output_dir = os.path.join(base_dir, "clean", rel_path)
    
    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    
    # Prepare output filename
    base_name = os.path.basename(vtt_path)
    txt_name = os.path.splitext(base_name)[0] + '.txt'
    output_path = os.path.join(output_dir, txt_name)
    
    text_content = []
    current_paragraph = []
    
    with open(vtt_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    # Skip header (everything before first empty line)
    start_idx = 0
    for i, line in enumerate(lines):
        if line.strip() == "":
            start_idx = i + 1
            break
    
    for line in lines[start_idx:]:
        line = line.strip()
        
        # Skip empty lines, timestamps, and NOTE lines
        if (not line or 
            '-->' in line or 
            line.startswith('NOTE') or 
            line.replace('.', '').isdigit()):
            if current_paragraph:
                text_content.append(' '.join(current_paragraph))
                current_paragraph = []
            continue
        
        # Clean and add non-empty lines
        cleaned_line = clean_vtt_line(line)
        if cleaned_line:
            # Start a new paragraph if the line ends with a period or after 5 lines
            if current_paragraph and (current_paragraph[-1].endswith('.') or len(current_paragraph) > 5):
                text_content.append(' '.join(current_paragraph))
                current_paragraph = []
            current_paragraph.append(cleaned_line)
    
    # Add the last paragraph if there's any remaining text
    if current_paragraph:
        text_content.append(' '.join(current_paragraph))
    
    # Join all paragraphs with single newlines and write to file
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(text for text in text_content if text.strip()))
    
    return output_path

def process_directory(input_dir, output_dir=None):
    """Process all VTT files in a directory and its subdirectories."""
    if not os.path.exists(input_dir):
        print(f"Input directory {input_dir} does not exist")
        return
        
    if output_dir is None:
        # If no output directory specified, use the clean directory parallel to dirty
        if "dirty" in input_dir:
            base_dir = os.path.dirname(os.path.dirname(input_dir))  # Go up past dirty
            rel_path = os.path.relpath(input_dir, os.path.join(base_dir, "dirty"))
            output_dir = os.path.join(base_dir, "clean", rel_path)
        else:
            output_dir = os.path.join(os.path.dirname(input_dir), "clean")
    
    vtt_files = []
    # Find all VTT files in the directory and subdirectories
    for root, _, files in os.walk(input_dir):
        for file in files:
            if file.endswith('.vtt'):
                vtt_path = os.path.join(root, file)
                # Calculate relative path to maintain directory structure
                rel_path = os.path.relpath(root, input_dir)
                output_subdir = os.path.join(output_dir, rel_path)
                vtt_files.append((vtt_path, output_subdir))
    
    if not vtt_files:
        print(f"No VTT files found in {input_dir}")
        return
    
    print(f"Found {len(vtt_files)} VTT files to process")
    
    for vtt_path, output_subdir in vtt_files:
        try:
            output_file = convert_vtt_to_text(vtt_path, output_subdir)
            print(f"Processed: {os.path.basename(vtt_path)} -> {output_file}")
        except Exception as e:
            print(f"Error processing {vtt_path}: {str(e)}")

def main():
    if len(sys.argv) < 2:
        print("Usage: python vtt_to_text.py <input_directory_or_file> [output_directory]")
        sys.exit(1)
    
    input_path = sys.argv[1]
    output_dir = sys.argv[2] if len(sys.argv) > 2 else None
    
    if os.path.isfile(input_path):
        if not input_path.endswith('.vtt'):
            print("Input file must be a VTT file")
            sys.exit(1)
        output_file = convert_vtt_to_text(input_path, output_dir)
        print(f"Processed: {input_path} -> {output_file}")
    else:
        process_directory(input_path, output_dir)

if __name__ == "__main__":
    main() 