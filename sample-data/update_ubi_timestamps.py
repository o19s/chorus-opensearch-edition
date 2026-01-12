import json
import sys
from datetime import datetime, timedelta

# Get input and output file paths from command-line arguments
if len(sys.argv) != 3:
    print("Usage: python update_ubi_timestamps.py <input_file> <output_file>")
    sys.exit(1)

input_file = sys.argv[1]
output_file = sys.argv[2]

current_date = datetime.now()

# Read the input file
try:
    with open(input_file, 'r') as f:
        lines = f.read().splitlines()
except FileNotFoundError:
    print(f"Error: Input file '{input_file}' not found")
    sys.exit(1)

# First pass: Find the most recent timestamp
most_recent = -10000
for line in lines:
    if not line.strip():
        continue
    
    try:
        json_data = json.loads(line)
    except json.JSONDecodeError:
        continue
    
    # Check if the timestamp field exists
    if 'timestamp' in json_data:
        timestamp_value = json_data.get('timestamp')
        
        if isinstance(timestamp_value, int):
            # Convert milliseconds to seconds
            date = datetime.fromtimestamp(timestamp_value / 1000.0)
        else:
            # Handle string timestamps
            timestamp_str = timestamp_value.replace("+0000", 'Z')
            date = datetime.strptime(timestamp_str, "%Y-%m-%dT%H:%M:%S.%fZ")
        
        days_difference = (date - current_date).days
        if days_difference > most_recent:
            most_recent = days_difference

print(f'Most Recent is {most_recent} days ago')

# Calculate the delta to bring dates to the present
delta = timedelta(days=-most_recent)

# Second pass: Write updated JSON documents to output file
with open(output_file, 'w') as f_out:
    for line in lines:
        if not line.strip():
            continue
        
        try:
            json_data = json.loads(line)
        except json.JSONDecodeError:
            # Write malformed lines as-is
            f_out.write(line + '\n')
            continue
        
        # Check if the timestamp field exists
        if 'timestamp' in json_data:
            timestamp_value = json_data.get('timestamp')
            
            if isinstance(timestamp_value, int):
                # Convert milliseconds to seconds
                date = datetime.fromtimestamp(timestamp_value / 1000.0)
            else:
                # Handle string timestamps
                timestamp_str = timestamp_value.replace("+0000", 'Z')
                date = datetime.strptime(timestamp_str, "%Y-%m-%dT%H:%M:%S.%fZ")
            
            # Update the date by adding the delta
            new_date = date + delta
            
            # Format timestamp to match OpenSearch strict_date_time format (milliseconds + Z)
            json_data['timestamp'] = new_date.strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"
        
        # Write the JSON string with a newline to preserve the structure
        f_out.write(json.dumps(json_data) + '\n')

print(f'Successfully updated timestamps and wrote to {output_file}')