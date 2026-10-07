import os

path = 'API/src/modules/dev/dev.controller.ts'
with open(path, 'r') as f:
    content = f.read()

# Add import
if 'import bcrypt from' not in content:
    content = content.replace(
        "import mongoose from 'mongoose';",
        "import mongoose from 'mongoose';\nimport bcrypt from 'bcryptjs';"
    )

# Add password hashing
hash_code = """
      let documentsToInsert = documents;
      if (modelName === 'User' && documentsToInsert.length > 0) {
        // Only hash passwords for fixed development users
        documentsToInsert = await Promise.all(documents.map(async (doc: any) => {
          if (doc.__isFixed && doc.password === 'devdev') {
            doc.password = await bcrypt.hash('devdev', 12);
          }
          return doc;
        }));
      }

      if (documentsToInsert.length > 0) {
"""

content = content.replace("      if (documents.length > 0) {", hash_code)
content = content.replace("await Model.insertMany(documents, { ordered: false, rawResult: true });", "await Model.insertMany(documentsToInsert, { ordered: false, rawResult: true });")
content = content.replace("inserted = documents.length;", "inserted = documentsToInsert.length;")
content = content.replace("failed = documents.length - inserted - skipped;", "failed = documentsToInsert.length - inserted - skipped;")
content = content.replace("failed = documents.length;", "failed = documentsToInsert.length;")

# Fix the duplicate logic
duplicate_logic = """
            // Distinguish skipped vs failed
            const genuineErrors = [];
            for (const we of writeErrors) {
              const doc = documentsToInsert[we.index];
              if (we.code === 11000 && doc && doc.__isFixed) {
                // Fixed account already exists -> intentionally skipped
                // But we must ensure its password is reset to devdev
                if (modelName === 'User' && doc.password) {
                  await Model.updateOne({ _id: doc._id }, { $set: { password: doc.password } });
                }
                skipped++;
              } else {
                genuineErrors.push(we);
              }
            }
"""

# Be very careful matching this
content = content.replace("""
            // Distinguish skipped vs failed
            const genuineErrors = [];
            for (const we of writeErrors) {
              const doc = documents[we.index];
              if (we.code === 11000 && doc && doc.__isFixed) {
                // Fixed account already exists -> intentionally skipped
                skipped++;
              } else {
                genuineErrors.push(we);
              }
            }
""", duplicate_logic)

with open(path, 'w') as f:
    f.write(content)

print("Patched dev.controller.ts")
