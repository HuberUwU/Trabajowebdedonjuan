import pandas as pd
import json

file_path = r"C:\Users\thepa\Desktop\puesto don juan.xlsx"
try:
    df = pd.read_excel(file_path, header=None)
    data = []
    for index, row in df.iterrows():
        name = str(row[0]).strip()
        if pd.notna(row[1]):
            try:
                price = float(row[1])
            except ValueError:
                price = 0.0
        else:
            price = 0.0
        
        if name and name != "nan":
            data.append({"id": index + 1, "name": name, "price": price, "image": ""})
            
    with open(r"C:\Users\thepa\.gemini\antigravity\scratch\don_juan_reservations\menu.json", "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print("Success")
except Exception as e:
    print(f"Error: {e}")
