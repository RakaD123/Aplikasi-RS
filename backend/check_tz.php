<?php
echo 'Timezone: ' . config('app.timezone') . "\n";
echo 'Today: ' . today()->toDateString() . "\n";
echo 'Now: ' . now()->toDateTimeString() . "\n";
