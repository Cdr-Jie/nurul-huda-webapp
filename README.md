# Nurul Huda Webapp

A React + TypeScript + Vite web application integrated with Supabase.

# TODO
1. Role based access
   - Limit access to certain user (Pihak tertinggi oversee all can see all module, categories each activity to certain biro (only specific biro can edit the biro activity to avoid other biro to edit it)
2. Add Inventory Management Module ( Put status to certain object (available or unavailable) and who borrow it to help Pihak masjid identified who borrow it
3. Divide the finance module into multiple components for easier analysis
   - Cash and qr to avoid mixed income money
   - (Extra component needed) jumaat prayer - the income donation and how much people come (people count)
4. Add sejarah masjid and carta organisasi (Will be sent by Pihak masjid)
5. Calendar annual acitivity (categories activity to months) 
6. Place to put official document (folder)

# Scaling
On the issue of scaling, the most probable run-in we would have is database storage running out
We are not really worried about tables running out of space though, as there just isn't enough users/events/transactions/assets

The plan is to delete storage items from the database once 3 years have passed (example: event poster uploaded in 2026 will be removed on 2030)
We'll move those to the Masjid Nurul Huda google drive though, since it has greater amount of storage

# Pro tip: Increasing google drive storage is much cheaper than going pro on Supabase
