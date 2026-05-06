from flask import Flask, render_template, jsonify
import json
import os

app = Flask(__name__)

# Caminho até o arquivo JSON com os tutoriais
DATA_PATH = os.path.join(os.path.dirname(__file__), 'data', 'tutoriais.json')

def carregar_tutoriais():
    """Lê o arquivo JSON e retorna os dados."""
    with open(DATA_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)

@app.route('/')
def index():
    """Rota principal — serve a página HTML."""
    return render_template('index.html')

@app.route('/api/tutoriais')
def api_tutoriais():
    """Rota da API — devolve os tutoriais em formato JSON."""
    dados = carregar_tutoriais()
    return jsonify(dados)

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)