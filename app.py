from flask import Flask, json,flash, render_template, request, jsonify, send_from_directory, Response
import mysql.connector
import os
import pandas as pd
import numpy as np
import joblib
import pickle
from langchain_core.messages import HumanMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from flask import redirect, url_for, session
from flask_mail import Mail, Message
from itsdangerous import URLSafeTimedSerializer

app = Flask(__name__)

app.secret_key = os.urandom(24)

# Configure Flask-Mail (use your email service settings)
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = 'ruchabhalchandra111@gmail.com'
app.config['MAIL_PASSWORD'] = 'vtvt fxxx atea ucup'
mail = Mail(app)

serializer = URLSafeTimedSerializer(app.secret_key)


# Load Model
encoder = joblib.load('encoder.pkl')
model = joblib.load('kmeans.pkl')
scaler = joblib.load('scaler.pkl')
autoencoder = joblib.load('autoencoder.pkl')

# Configure MySQL
db_config = {
    'user': 'root',
    'password': '',
    'host': 'localhost',
    'database': 'customer'
}

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/team')
def team():
    return render_template('team.html')

@app.route('/services')
def services():
    return render_template('services.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form['email']
        phone = request.form['password']
        
        # Generate a unique token
        token = serializer.dumps({'email': email, 'phone': phone}, salt='login-salt')

        # Create the confirmation URL
        confirm_url = url_for('confirm_login', token=token, _external=True)

        # Send email with confirmation link
        send_email(email, confirm_url)

        flash('A confirmation link has been sent to your email. Please click the link to access the dashboard.', 'info')
        return redirect(url_for('login'))
    
    return render_template('login.html')

@app.route('/confirm/<token>', methods=['GET', 'POST'])
def confirm_login(token):
    try:
        # Load the token data
        data = serializer.loads(token, salt='login-salt', max_age=300)  # Token expires after 1 minute
        email = data['email']
        phone = data['phone']

        # Connect to the database and retrieve user profile
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()

        # Check if the email and phone number match
        cursor.execute("SELECT * FROM customer_details WHERE email_address=%s AND phone_number=%s", (email, phone))
        profile = cursor.fetchone()

        conn.close()

        if profile is None:
            return render_template('sorry.html')

        # Log in the user by creating a session
        session['email'] = email

        # Redirect to the dashboard after successful login
        return redirect(url_for('dashboard'))

    except Exception as e:
        print(f"Error: {e}")
        return "The confirmation link is invalid or has expired."

@app.route('/dashboard')
def dashboard():
    if 'email' in session:
        try:
            email = session['email']
            # Connect to the database and retrieve user profile
            conn = mysql.connector.connect(**db_config)
            cursor = conn.cursor()
            
            cursor.execute("SELECT * FROM customer_details WHERE email_address=%s", (email,))
            profile = cursor.fetchone()

            if profile is None:
                cursor.close()
                conn.close()
                return render_template('sorry.html')

            # Ensure all results are fetched before proceeding to the next query
            cursor.fetchall()

            cursor.execute("SELECT * FROM credit_history WHERE customer_id=%s", (profile[0],))
            credit = cursor.fetchone()
            cursor.fetchall()

            cursor.execute("SELECT * FROM credit_inquiry WHERE customer_id=%s", (profile[0],))
            inquiry = cursor.fetchone()
            cursor.fetchall()

            cursor.execute("SELECT * FROM debt_profile WHERE customer_id=%s", (profile[0],))
            debt = cursor.fetchone()
            cursor.fetchall()

            cursor.execute("SELECT SUM(loan_amount) FROM loan_details WHERE customer_id=%s", (profile[0],))
            loan = cursor.fetchone()
            cursor.fetchall()

            cursor.execute("SELECT * FROM loan_details WHERE customer_id=%s", (profile[0],))
            allloan = cursor.fetchall()

            cursor.execute("SELECT * FROM tracker WHERE customer_id=%s", (profile[0],))
            payment = cursor.fetchone()
            cursor.fetchall()

            cursor.execute("SELECT April, May, June, July FROM month_credit_scores WHERE customer_id=%s", (profile[0],))
            cc = cursor.fetchone()
            cursor.fetchall()

            cursor.execute("SELECT Aug, Sep, Oct, Nov, Dece, Jan, Feb, Mar, Apr, May, Jun, Jul, loan_type FROM tracker WHERE customer_id=%s", (profile[0],))
            track = cursor.fetchall()

            # cursor.close()
            conn.close()

            cc = list(cc)
            track_list = [list(i) for i in track]

            if None in [credit, inquiry, debt, loan, payment]:
                return render_template('sorry.html')

            user_data = pd.DataFrame({
                'Age': profile[10],
                'Marital_Status': profile[11],
                'Employment_Status': profile[14],
                'Annual_Income': profile[15],
                'Total_credit_Accounts': credit[2],
                'Account_Age_Years': credit[1],
                'Loan_Amount': loan,
                'On_Time_Payments': payment[14],
                'Late_Payments': payment[15],
                'Missed_Payments': payment[13],
                'Total_Hard_Enquiries': inquiry[2],
                'Total_credit_limit': credit[5],
                'Total_credit_balance': credit[6],
                'Total_Debt': debt[2],
                },index=[0]
            )
            
            categorical_columns = ['Marital_Status', 'Employment_Status']
            for col in categorical_columns:
                if col in encoder:
                    user_data[col] = encoder[col].transform(user_data[col])

            new_data_scaled = scaler.transform(user_data)

            encoded_data = autoencoder.predict(new_data_scaled)

            data = model.predict(encoded_data)

            encoded_data=pd.DataFrame(encoded_data)

            # Calculate distances to centroids
            distances = model.transform(encoded_data)
            min_distances = np.min(distances, axis=1)
            average_distance = np.mean(distances)

            min_score = 300
            max_score = 850
            sample_credit_score = min_score + (1 - min_distances / average_distance) * (max_score - min_score)
            creditscore = sample_credit_score.astype('int') 

            matrix = [list(row) for row in allloan]
            sentence = (
                f"The user is {user_data['Age'][0]} years old, "
                f"They have an annual income of {user_data['Annual_Income'][0]:,.2f}, "
                f"with {user_data['Total_credit_Accounts'][0]} credit accounts over an account age of {user_data['Account_Age_Years'][0]} years. "
                f"Their current loan amount is {user_data['Loan_Amount']}. "
                f"They have made {user_data['On_Time_Payments'][0]} on-time payments, with {user_data['Late_Payments'][0]} late payments and "
                f"{user_data['Missed_Payments'][0]} missed payments. "
                f"They have {user_data['Total_Hard_Enquiries'][0]} hard inquiries, a total credit limit of {user_data['Total_credit_limit'][0]:,.2f}, "
                f"and a total credit balance of {user_data['Total_credit_balance'][0]:,.2f}, "
                f"Their total debt amounts to {user_data['Total_Debt'][0]:,.2f}."
            )
        
            return render_template('result.html', cc=cc ,user=sentence, credit_score=creditscore, profile=profile, loan=loan, allloan=allloan, credit=credit, inquiry=inquiry, debt=debt, track=track_list)
        except Exception as e:
                print(f"Error in dashboard: {e}")
                return "An error occurred while processing your request."
    
    return redirect(url_for('login'))

def send_email(to_email, confirm_url):
    try:
        msg = Message('Login Confirmation', sender=app.config['MAIL_USERNAME'], recipients=[to_email])
        html_content = f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 0;
                    background-color: #f4f4f4;
                }}
                .container {{
                    width: 100%;
                    max-width: 600px;
                    margin: 0 auto;
                    background: #ffffff;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    overflow: hidden;
                }}
                .header {{
                    background-color: #007bff;
                    padding: 20px;
                    text-align: center;
                }}
                .header img {{
                    max-width: 150px;
                    height: auto;
                }}
                .content {{
                    padding: 20px;
                }}
                .button {{
                    display: inline-block;
                    padding: 10px 20px;
                    margin: 20px 0;
                    font-size: 16px;
                    color: white;
                    background-color: #b1b1b1;
                    text-decoration: none;
                    border-radius: 5px;
                }}
                .footer {{
                    background-color: #f4f4f4;
                    padding: 10px;
                    text-align: center;
                    font-size: 12px;
                    color: #777;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <img src="https://cdn-icons-png.flaticon.com/512/9382/9382295.png" alt="Team Innov8ors Logo">
                </div>
                <div class="content">
                    <h2>Hello,</h2>
                    <p>Thank you for registering with Team Innov8ors!</p>
                    <p>To access your account, please click the button below to log in:</p>
                    <a href="{confirm_url}" class="button">Log In</a>
                    <p>If you did not request this, please ignore this email.</p>
                </div>
                <div class="footer">
                    &copy; 2024 Team Innov8ors. All rights reserved.
                </div>
            </div>
        </body>
        </html>
        """

        # Set the email content and type
        msg.html = html_content
        mail.send(msg)
    except Exception as e:
        print(f"Error sending email: {e}")




# Directly pass the API key
os.environ["GOOGLE_API_KEY"] = "AIzaSyBn-yC_XPngiTUtnTk06ZHVJHAA-pmbfRo"; 

@app.route("/api/generate", methods=["POST"])
def generate_api():
    if request.method == "POST":
        try:
            req_body = request.get_json()
            content = req_body.get("contents")
            model = ChatGoogleGenerativeAI(model=req_body.get("model", "gemini-pro"))
            message = HumanMessage(content=content)
            response = model.stream([message])

            def stream():
                for chunk in response:
                    yield f'data: {json.dumps({"text": chunk.content})}\n\n'

            return Response(stream(), content_type='text/event-stream')

        except Exception as e:
            print(f"Error in generate_api: {str(e)}")
            return jsonify({"error": str(e)}), 500

            
if __name__ == '__main__':
    app.run(debug=True)

