from flask import Flask, Response, jsonify
import torch
import sys
import os

models_dir_path = sys.argv[1]

models = {}

app = Flask(__name__, static_folder='front/dist', static_url_path='')

@app.route('/models', methods=['GET'])
def get_models():
    models = [f for f in os.listdir(models_dir_path) if f.endswith('.pt') or f.endswith('.pth')]
    return jsonify(models)

@app.route('/models/<model_name>/params', methods=['GET'])
def get_params(model_name):
    model_file_path = os.path.join(models_dir_path, model_name)
    if model_file_path not in models:
        models[model_file_path] = torch.load(model_file_path, map_location='cpu')
    model = models[model_file_path]

    model_details = [
        {
            "name": key,
            "shape": list(tensor.shape),
            "type": str(tensor.dtype)
        }
        for key, tensor in model.items() if torch.is_tensor(tensor)
    ]
    return jsonify(model_details)

@app.route('/models/<model_name>/params/<path:path>', methods=['GET'])
def get_param(model_name, path):
    model_file_path = os.path.join(models_dir_path, model_name)
    if model_file_path not in models:
        models[model_file_path] = torch.load(model_file_path, map_location='cpu')
    model = models[model_file_path]

    tensor = model.get(path, None)

    if tensor is None or not torch.is_tensor(tensor) or tensor.dtype != torch.float:
        return Response("Requested path is not a valid", status=404)

    return Response(tensor.numpy().tobytes(), mimetype='application/octet-stream')

if __name__ == '__main__':
    app.run(debug=True)
