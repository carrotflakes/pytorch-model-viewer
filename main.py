from flask import Flask, Response, jsonify, send_from_directory
import torch
import sys

model_file_path = sys.argv[1]

model = torch.load(model_file_path, map_location='cpu')

app = Flask(__name__, static_folder='front/dist', static_url_path='')

@app.route('/params', methods=['GET'])
def get_params():
    model_details = [
        {
            "name": key,
            "shape": list(tensor.shape),
            "type": str(tensor.dtype)
        }
        for key, tensor in model.items() if torch.is_tensor(tensor)
    ]
    return jsonify(model_details)

@app.route('/params/<path:path>', methods=['GET'])
def get_param(path):
    tensor = model.get(path, None)

    if tensor is None or not torch.is_tensor(tensor) or tensor.dtype != torch.float:
        return Response("Requested path is not a valid", status=404)

    return Response(tensor.numpy().tobytes(), mimetype='application/octet-stream')

if __name__ == '__main__':
    app.run(debug=True)
