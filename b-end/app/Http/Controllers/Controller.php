<?php

namespace App\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Foundation\Validation\ValidatesRequests;
use Illuminate\Routing\Controller as BaseController;
/*use Illuminate\Foundation\Auth\Access\AuthorizesResources; DELTE mo lang tong line jude*/

class Controller extends BaseController
{
    use AuthorizesRequests, ValidatesRequests;
}
