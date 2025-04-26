import sqlite3

# Connect to the database
conn = sqlite3.connect('app.db')
cursor = conn.cursor()

# Get all company-user associations
print("Company-User Associations:")
cursor.execute("SELECT * FROM company_user_association")
associations = cursor.fetchall()
for assoc in associations:
    print(assoc)

# Get all users
print("\nUsers:")
cursor.execute("SELECT id, email, role, roles FROM users")
users = cursor.fetchall()
for user in users:
    print(user)

# Get all companies
print("\nCompanies:")
cursor.execute("SELECT id, name FROM companies")
companies = cursor.fetchall()
for company in companies:
    print(company)

# Get associations for multiuser1
print("\nAssociations for multiuser1:")
cursor.execute("""
    SELECT u.email, c.name 
    FROM company_user_association cua
    JOIN users u ON u.id = cua.user_id
    JOIN companies c ON c.id = cua.company_id
    WHERE u.email LIKE '%multi1%'
""")
multi_assocs = cursor.fetchall()
for assoc in multi_assocs:
    print(assoc)

# Close connection
conn.close() 