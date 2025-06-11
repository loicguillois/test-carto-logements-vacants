import csv
import json

# Remplace par le chemin réel de ton fichier CSV
csv_file = 'logement_vacants_communes.csv'

result = {}

with open(csv_file, newline='', encoding='utf-8') as f:
    reader = csv.DictReader(f, delimiter=';')
    for row in reader:
        code = row['CODGEO_25']
        value_str = row['pp_vacant_plus_2ans_25'].strip()
        if value_str.isdigit():  # Ignore les valeurs non numériques comme "s"
            result[code] = {'pp_vacant_plus_2ans_25': int(value_str)}

# Affichage du JSON formaté
json_output = json.dumps(result, indent=2, ensure_ascii=False)
print(json_output)
