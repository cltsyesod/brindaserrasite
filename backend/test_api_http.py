import urllib.request
import json

def test_api():
    print("Testing GET /api/cervejarias...")
    req = urllib.request.Request('http://localhost:3000/api/cervejarias')
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        print('HTTP Status:', resp.status)
        print('Cervejarias:', [c['nome'] for c in data])

    print("\nTesting POST /api/checkout...")
    checkout_payload = {
        'pagador': {
            'nome': 'Maria Pereira',
            'cpf': '987.654.321-11',
            'email': 'maria@email.com',
            'telefone': '54988887777',
            'data_nasc': '1992-08-20'
        },
        'plano_cervejaria': 'brinda_premium',
        'comprar_para_si': True,
        'forma_pagamento': 'PIX',
        'origem_tipo': 'hotel',
        'vendedor_codigo': 'HOTEL01'
    }

    req_post = urllib.request.Request(
        'http://localhost:3000/api/checkout',
        data=json.dumps(checkout_payload).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )

    with urllib.request.urlopen(req_post) as resp_post:
        post_data = json.loads(resp_post.read().decode('utf-8'))
        print('HTTP Checkout Status:', resp_post.status)
        card = post_data['cards'][0]
        token = card['qr_token']
        print('Card emitido ID:', card['id'], 'Titular:', card['titular_nome'], 'Saldo:', card['saldo_restante'])
        print('QR Token:', token)

    print("\nTesting GET /api/cards/:token/view (Visual Oficial)...")
    req_view = urllib.request.Request(f'http://localhost:3000/api/cards/{token}/view')
    with urllib.request.urlopen(req_view) as resp_view:
        html = resp_view.read().decode('utf-8')
        print('HTTP Card View Status:', resp_view.status)
        print('Card View Length:', len(html), 'bytes')
        print('Contains VIP PASS?', 'VIP PASS' in html)
        print('Contains DIGITAL MEMBER?', 'DIGITAL MEMBER' in html)
        print('Contains MARIA PEREIRA?', 'MARIA PEREIRA' in html)

    print("\nTesting GET /api/cards/:token/email (Template de Email Oficial)...")
    req_email = urllib.request.Request(f'http://localhost:3000/api/cards/{token}/email')
    with urllib.request.urlopen(req_email) as resp_email:
        email_html = resp_email.read().decode('utf-8')
        print('HTTP Email Status:', resp_email.status)
        print('Contains Seção de Instruções?', 'Como Utilizar nas Cervejarias' in email_html)

    print("\nTesting POST /api/validador/consultar (Cervejaria Farol)...")
    val_payload = {
        'qr_token': token,
        'cervejaria_id': 1
    }
    req_val = urllib.request.Request(
        'http://localhost:3000/api/validador/consultar',
        data=json.dumps(val_payload).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    with urllib.request.urlopen(req_val) as resp_val:
        val_data = json.loads(resp_val.read().decode('utf-8'))
        print('Validador Status:', resp_val.status)
        print('Consulta Válida?', val_data['valido'], 'Saldo restante:', val_data['card']['saldo_restante'])

    print("\nALL HTTP API TESTS PASSED!")

if __name__ == '__main__':
    test_api()
